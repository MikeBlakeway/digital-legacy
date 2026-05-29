import { inferPersona, type InferMessage } from "@/lib/runpod/infer";

const messages: InferMessage[] = [{ role: "user", content: "Hello" }];

async function assertInferPersonaContract() {
  const result: { text: string } = await inferPersona({
    system_prompt: "You are Mike.",
    messages,
    max_tokens: 128,
    temperature: 0.7,
  });

  return result.text;
}

void assertInferPersonaContract();
