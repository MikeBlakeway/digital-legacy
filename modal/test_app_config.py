import ast
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent
APP_FILE = ROOT / "app.py"


class ModalAppConfigTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if not APP_FILE.exists():
            raise AssertionError(f"Missing expected file: {APP_FILE}")

        cls.source = APP_FILE.read_text(encoding="utf-8")
        cls.tree = ast.parse(cls.source)

    def test_modal_app_exports_expected_symbols(self) -> None:
        assignments = find_assignments(self.tree)
        for required in [
            "app",
            "volume",
            "base_image",
            "embed_image",
            "stt_image",
            "tts_image",
            "infer_image",
        ]:
            self.assertIn(required, assignments, f"Missing assignment for {required}")

        app_call = assignments["app"]
        self.assertTrue(is_attr_call(app_call, ["modal", "App"]))
        self.assertEqual(get_constant_arg(app_call, 0), "digital-legacy")

    def test_modal_volume_configured_for_model_weights(self) -> None:
        assignments = find_assignments(self.tree)
        volume_call = assignments["volume"]

        self.assertTrue(is_attr_call(volume_call, ["modal", "Volume", "from_name"]))
        self.assertEqual(get_constant_arg(volume_call, 0), "digital-legacy-weights")
        self.assertTrue(get_keyword_bool(volume_call, "create_if_missing"))

    def test_modal_images_build_with_required_packages(self) -> None:
        assignments = find_assignments(self.tree)

        base_packages = pip_install_packages(assignments["base_image"])
        self.assertIn("huggingface_hub", base_packages)
        self.assertIn("boto3", base_packages)

        embed_packages = pip_install_packages(assignments["embed_image"])
        self.assertIn("sentence-transformers", embed_packages)
        self.assertIn("torch", embed_packages)

        stt_packages = pip_install_packages(assignments["stt_image"])
        self.assertIn("faster-whisper", stt_packages)
        self.assertIn("torch", stt_packages)

        tts_packages = pip_install_packages(assignments["tts_image"])
        self.assertIn("TTS", tts_packages)
        self.assertIn("torch", tts_packages)
        self.assertIn("torchaudio", tts_packages)

        infer_packages = pip_install_packages(assignments["infer_image"])
        self.assertIn("vllm", infer_packages)
        self.assertIn("huggingface_hub", infer_packages)

    def test_functions_define_required_secret_wiring(self) -> None:
        functions = {node.name: node for node in self.tree.body if isinstance(node, ast.FunctionDef)}
        for required in ["download_models", "embed", "stt", "tts", "infer"]:
            self.assertIn(required, functions, f"Missing function {required}")

        for name in ["download_models", "embed", "stt", "tts", "infer"]:
            secrets = extract_secret_names(functions[name])
            self.assertIn(
                "digital-legacy-b2",
                secrets,
                f"Function {name} must include digital-legacy-b2 secret",
            )

        for name in ["download_models", "infer"]:
            secrets = extract_secret_names(functions[name])
            self.assertIn("huggingface", secrets, f"Function {name} must include huggingface secret")

    def test_endpoint_decorators_and_scaledown_windows(self) -> None:
        functions = {node.name: node for node in self.tree.body if isinstance(node, ast.FunctionDef)}

        expected_scaledown = {
            "embed": 30,
            "stt": 120,
            "tts": 120,
            "infer": 600,
        }

        for name, scaledown in expected_scaledown.items():
            fn = functions[name]
            self.assertTrue(has_web_post_decorator(fn), f"Function {name} must expose POST web endpoint")
            self.assertEqual(
                get_function_keyword_int(fn, "scaledown_window"),
                scaledown,
                f"Function {name} scaledown_window must be {scaledown}",
            )


def find_assignments(tree: ast.Module) -> dict[str, ast.AST]:
    assignments: dict[str, ast.AST] = {}
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    assignments[target.id] = node.value
    return assignments


def is_attr_call(node: ast.AST, path: list[str]) -> bool:
    if not isinstance(node, ast.Call):
        return False

    return get_attr_path(node.func) == path


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


def get_constant_arg(call: ast.AST, index: int) -> str | None:
    if not isinstance(call, ast.Call):
        return None
    if len(call.args) <= index:
        return None
    value = call.args[index]
    return value.value if isinstance(value, ast.Constant) and isinstance(value.value, str) else None


def get_keyword_bool(call: ast.AST, key: str) -> bool:
    if not isinstance(call, ast.Call):
        return False

    for keyword in call.keywords:
        if keyword.arg == key and isinstance(keyword.value, ast.Constant):
            return bool(keyword.value.value)
    return False


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


def extract_secret_names(function: ast.FunctionDef) -> set[str]:
    secrets: set[str] = set()

    for decorator in function.decorator_list:
        if not isinstance(decorator, ast.Call):
            continue
        if not isinstance(decorator.func, ast.Attribute):
            continue
        if decorator.func.attr != "function":
            continue

        for keyword in decorator.keywords:
            if keyword.arg != "secrets" or not isinstance(keyword.value, ast.List):
                continue

            for secret_expr in keyword.value.elts:
                if not isinstance(secret_expr, ast.Call):
                    continue
                if not is_attr_call(secret_expr, ["modal", "Secret", "from_name"]):
                    continue
                name = get_constant_arg(secret_expr, 0)
                if name:
                    secrets.add(name)

    return secrets


def has_web_post_decorator(function: ast.FunctionDef) -> bool:
    for decorator in function.decorator_list:
        if not isinstance(decorator, ast.Call):
            continue
        if not is_attr_call(decorator, ["modal", "web_endpoint"]):
            continue

        for keyword in decorator.keywords:
            if keyword.arg == "method" and isinstance(keyword.value, ast.Constant):
                return keyword.value.value == "POST"

    return False


def get_function_keyword_int(function: ast.FunctionDef, key: str) -> int | None:
    for decorator in function.decorator_list:
        if not isinstance(decorator, ast.Call):
            continue
        if not isinstance(decorator.func, ast.Attribute) or decorator.func.attr != "function":
            continue

        for keyword in decorator.keywords:
            if keyword.arg == key and isinstance(keyword.value, ast.Constant):
                return int(keyword.value.value)

    return None


if __name__ == "__main__":
    unittest.main()
