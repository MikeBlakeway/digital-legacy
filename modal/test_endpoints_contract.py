import ast
import unittest
from pathlib import Path


APP_FILE = Path(__file__).resolve().parent / "app.py"


class EndpointContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        source = APP_FILE.read_text(encoding="utf-8")
        cls.tree = ast.parse(source)
        cls.functions = {node.name: node for node in cls.tree.body if isinstance(node, ast.FunctionDef)}

    def test_embed_returns_embedding_matrix(self) -> None:
        fn = self.functions["embed"]
        self.assertTrue(contains_string(fn, "/model-weights/nomic-embed-text"))
        self.assertTrue(call_has_keyword(fn, "encode", "normalize_embeddings", True))
        self.assertTrue(returns_key(fn, "embeddings"))

    def test_stt_decodes_audio_and_returns_transcript(self) -> None:
        fn = self.functions["stt"]
        self.assertTrue(call_uses_name(fn, "b64decode"))
        self.assertTrue(contains_string(fn, "/model-weights/faster-whisper-large-v3"))
        self.assertTrue(returns_key(fn, "transcript"))
        self.assertTrue(returns_key(fn, "duration_seconds"))

    def test_tts_returns_audio_base64(self) -> None:
        fn = self.functions["tts"]
        self.assertTrue(contains_string(fn, "speaker_wav_b2_key"))
        self.assertTrue(call_uses_name(fn, "download_fileobj"))
        self.assertTrue(returns_key(fn, "audio_base64"))

    def test_infer_builds_prompt_and_returns_text(self) -> None:
        fn = self.functions["infer"]
        self.assertTrue(contains_string(fn, "<|system|>"))
        self.assertTrue(contains_string(fn, "<|assistant|>"))
        self.assertTrue(returns_key(fn, "text"))
        self.assertTrue(call_uses_name(fn, "SamplingParams"))

    def test_infer_uses_lora_when_adapter_exists(self) -> None:
        fn = self.functions["infer"]
        self.assertTrue(contains_string(fn, "/model-weights/adapters/"))
        self.assertTrue(call_uses_attr(fn, ["os", "path", "exists"]))
        self.assertTrue(call_uses_name(fn, "LoRARequest"))


def contains_string(function: ast.FunctionDef, value: str) -> bool:
    for node in ast.walk(function):
        if isinstance(node, ast.Constant) and isinstance(node.value, str) and value in node.value:
            return True
    return False


def call_uses_name(function: ast.FunctionDef, name: str) -> bool:
    for node in ast.walk(function):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == name:
            return True
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == name:
            return True
    return False


def call_has_keyword(function: ast.FunctionDef, func_attr: str, key: str, expected: bool) -> bool:
    for node in ast.walk(function):
        if not isinstance(node, ast.Call):
            continue
        if not isinstance(node.func, ast.Attribute) or node.func.attr != func_attr:
            continue

        for keyword in node.keywords:
            if keyword.arg == key and isinstance(keyword.value, ast.Constant):
                return keyword.value.value is expected

    return False


def returns_key(function: ast.FunctionDef, key: str) -> bool:
    for node in ast.walk(function):
        if not isinstance(node, ast.Return):
            continue
        if not isinstance(node.value, ast.Dict):
            continue

        for dict_key in node.value.keys:
            if isinstance(dict_key, ast.Constant) and dict_key.value == key:
                return True

    return False


def call_uses_attr(function: ast.FunctionDef, path: list[str]) -> bool:
    for node in ast.walk(function):
        if not isinstance(node, ast.Call):
            continue
        if get_attr_path(node.func) == path:
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
