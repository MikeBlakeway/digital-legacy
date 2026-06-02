import ast
import unittest
from pathlib import Path


APP_FILE = Path(__file__).resolve().parent / "app.py"


class AnalyseEndpointContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        source = APP_FILE.read_text(encoding="utf-8")
        cls.tree = ast.parse(source)
        cls.assignments = find_assignments(cls.tree)
        cls.functions = {
            node.name: node for node in cls.tree.body if isinstance(node, ast.FunctionDef)
        }

    def test_analyse_image_matches_infer_dependencies(self) -> None:
        self.assertIn("analyse_image", self.assignments)
        packages = pip_install_packages(self.assignments["analyse_image"])

        self.assertIn("vllm", packages)
        self.assertIn("huggingface_hub", packages)
        self.assertIn("fastapi[standard]", packages)

    def test_analyse_endpoint_uses_expected_modal_config(self) -> None:
        fn = self.functions["analyse"]

        self.assertTrue(has_web_post_decorator(fn))
        self.assertEqual(get_function_keyword_name(fn, "image"), "analyse_image")
        self.assertEqual(get_function_keyword_string(fn, "gpu"), "A10G")
        self.assertEqual(get_function_keyword_int(fn, "timeout"), 600)
        self.assertEqual(get_function_keyword_int(fn, "scaledown_window"), 600)
        self.assertEqual(extract_volume_mount(fn), "/model-weights")
        self.assertIn("digital-legacy-b2", extract_secret_names(fn))
        self.assertIn("huggingface", extract_secret_names(fn))

    def test_analyse_dispatches_tasks_and_uses_json_guidance(self) -> None:
        fn = self.functions["analyse"]

        self.assertTrue(contains_string(fn, "trait_inference"))
        self.assertTrue(contains_string(fn, "emotion_classify"))
        self.assertTrue(contains_string(fn, "/model-weights/llama-3.1-8b-instruct"))
        self.assertTrue(contains_string(fn, "outlines"))
        self.assertTrue(
            contains_string(fn, "Your response must be valid JSON only. No preamble, no explanation.")
        )
        self.assertTrue(contains_string(fn, "parse_failed"))
        self.assertTrue(call_uses_name(fn, "json.loads"))
        self.assertTrue(call_uses_name(fn, "SamplingParams"))

    def test_analyse_does_not_use_lora(self) -> None:
        fn = self.functions["analyse"]

        self.assertFalse(contains_string(fn, "LoRARequest"))
        self.assertFalse(contains_string(fn, "/model-weights/adapters/"))
        self.assertFalse(call_uses_name(fn, "LoRARequest"))


def find_assignments(tree: ast.Module) -> dict[str, ast.AST]:
    assignments: dict[str, ast.AST] = {}
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    assignments[target.id] = node.value
    return assignments


def pip_install_packages(node: ast.AST) -> set[str]:
    packages: set[str] = set()

    def walk(expr: ast.AST) -> None:
        if isinstance(expr, ast.Call) and isinstance(expr.func, ast.Attribute):
            if expr.func.attr == "pip_install" and expr.args:
                arg = expr.args[0]
                if isinstance(arg, ast.List):
                    for item in arg.elts:
                        if isinstance(item, ast.Constant) and isinstance(item.value, str):
                            packages.add(item.value)
            walk(expr.func.value)

    walk(node)
    return packages


def has_web_post_decorator(function: ast.FunctionDef) -> bool:
    for decorator in function.decorator_list:
        if not isinstance(decorator, ast.Call):
            continue
        if get_attr_path(decorator.func) != ["modal", "fastapi_endpoint"]:
            continue

        for keyword in decorator.keywords:
            if keyword.arg == "method" and isinstance(keyword.value, ast.Constant):
                return keyword.value.value == "POST"

    return False


def get_function_keyword_name(function: ast.FunctionDef, key: str) -> str | None:
    for keyword in function_keywords(function):
        if keyword.arg == key and isinstance(keyword.value, ast.Name):
            return keyword.value.id
    return None


def get_function_keyword_string(function: ast.FunctionDef, key: str) -> str | None:
    for keyword in function_keywords(function):
        if keyword.arg == key and isinstance(keyword.value, ast.Constant):
            value = keyword.value.value
            return value if isinstance(value, str) else None
    return None


def get_function_keyword_int(function: ast.FunctionDef, key: str) -> int | None:
    for keyword in function_keywords(function):
        if keyword.arg == key and isinstance(keyword.value, ast.Constant):
            value = keyword.value.value
            return value if isinstance(value, int) else None
    return None


def function_keywords(function: ast.FunctionDef) -> list[ast.keyword]:
    for decorator in function.decorator_list:
        if not isinstance(decorator, ast.Call):
            continue
        if get_attr_path(decorator.func) == ["app", "function"]:
            return list(decorator.keywords)
    return []


def extract_volume_mount(function: ast.FunctionDef) -> str | None:
    for keyword in function_keywords(function):
        if keyword.arg != "volumes" or not isinstance(keyword.value, ast.Dict):
            continue
        for key in keyword.value.keys:
            if isinstance(key, ast.Constant) and isinstance(key.value, str):
                return key.value
    return None


def extract_secret_names(function: ast.FunctionDef) -> set[str]:
    secrets: set[str] = set()

    for keyword in function_keywords(function):
        if keyword.arg != "secrets" or not isinstance(keyword.value, ast.List):
            continue

        for secret_expr in keyword.value.elts:
            if not isinstance(secret_expr, ast.Call):
                continue
            if get_attr_path(secret_expr.func) != ["modal", "Secret", "from_name"]:
                continue
            if not secret_expr.args:
                continue
            name = secret_expr.args[0]
            if isinstance(name, ast.Constant) and isinstance(name.value, str):
                secrets.add(name.value)

    return secrets


def contains_string(function: ast.FunctionDef, value: str) -> bool:
    for node in ast.walk(function):
        if isinstance(node, ast.Constant) and isinstance(node.value, str) and value in node.value:
            return True
    return False


def call_uses_name(function: ast.FunctionDef, name: str) -> bool:
    for node in ast.walk(function):
        if not isinstance(node, ast.Call):
            continue
        if isinstance(node.func, ast.Name) and node.func.id == name:
            return True
        if isinstance(node.func, ast.Attribute) and node.func.attr == name:
            return True
        if ".".join(get_attr_path(node.func)) == name:
            return True
    return False


def get_attr_path(node: ast.AST) -> list[str]:
    parts: list[str] = []
    current = node

    while isinstance(current, ast.Attribute):
        parts.append(current.attr)
        current = current.value

    if isinstance(current, ast.Name):
        parts.append(current.id)
        parts.reverse()
        return parts

    return []


if __name__ == "__main__":
    unittest.main()
