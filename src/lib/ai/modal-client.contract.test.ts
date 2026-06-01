import {
  ModalError,
  callRunPodEndpoint,
  type RunPodFetch,
} from "@/lib/ai/client";
import { classifyEmotion, inferTraits } from "@/lib/ai/analyse";
import { embedTexts } from "@/lib/ai/embed";
import { inferPersona } from "@/lib/ai/infer";
import { transcribeAudio } from "@/lib/ai/stt";
import { synthesizeSpeech } from "@/lib/ai/tts";

async function client_posts_to_modal_url_with_json() {
  let capturedUrl = "";
  let capturedMethod = "";
  let capturedBody = "";

  const fetchFn: RunPodFetch = async (input, init) => {
    capturedUrl = String(input);
    capturedMethod = init?.method ?? "";
    capturedBody = String(init?.body ?? "");

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const output = await callRunPodEndpoint<{ hello: string }, { ok: boolean }>(
    "embed",
    { hello: "world" },
    {
      endpointUrl: "https://example.modal.run/embed",
      fetchFn,
    },
  );

  if (capturedUrl !== "https://example.modal.run/embed") {
    throw new Error(`Expected modal URL call, received ${capturedUrl}`);
  }

  if (capturedMethod !== "POST") {
    throw new Error(`Expected POST method, received ${capturedMethod}`);
  }

  if (capturedBody !== JSON.stringify({ hello: "world" })) {
    throw new Error(`Expected JSON body payload, received ${capturedBody}`);
  }

  if (!output.ok) {
    throw new Error("Expected successful modal output payload.");
  }
}

async function infer_uses_abortsignal_timeout_590_seconds() {
  const originalTimeout = AbortSignal.timeout;
  const timeoutCalls: number[] = [];

  (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout = (ms: number) => {
    timeoutCalls.push(ms);
    return originalTimeout(ms);
  };

  try {
    await inferPersona(
      {
        system_prompt: "You are Mike.",
        messages: [{ role: "user", content: "Hi" }],
      },
      {
        endpointUrl: "https://example.modal.run/infer",
        fetchFn: async () =>
          new Response(JSON.stringify({ text: "hello" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      },
    );
  } finally {
    (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout = originalTimeout;
  }

  if (!timeoutCalls.includes(590_000)) {
    throw new Error(`Expected AbortSignal.timeout(590000), received ${timeoutCalls.join(",")}`);
  }
}

async function wrapper_modules_preserve_contract_shapes() {
  const embed = await embedTexts(["hello"], {
    endpointUrl: "https://example.modal.run/embed",
    fetchFn: async () =>
      new Response(JSON.stringify({ embeddings: [new Array(768).fill(0.1)] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });

  const stt = await transcribeAudio(
    { audio_base64: "Zm9v", language: "en" },
    {
      endpointUrl: "https://example.modal.run/stt",
      fetchFn: async () =>
        new Response(JSON.stringify({ transcript: "hello", duration_seconds: 1.23 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    },
  );

  const tts = await synthesizeSpeech(
    { text: "hello", speaker_wav_b2_key: null, language: "en" },
    {
      endpointUrl: "https://example.modal.run/tts",
      fetchFn: async () =>
        new Response(JSON.stringify({ audio_base64: "Zm9v", duration_seconds: 1.11 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    },
  );

  const infer = await inferPersona(
    {
      system_prompt: "You are Mike.",
      messages: [{ role: "user", content: "Hello" }],
    },
    {
      endpointUrl: "https://example.modal.run/infer",
      fetchFn: async () =>
        new Response(JSON.stringify({ text: "Hi there" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    },
  );

  if (!Array.isArray(embed) || embed.length !== 1 || embed[0].length !== 768) {
    throw new Error("Embed wrapper contract changed unexpectedly.");
  }

  if (typeof stt.transcript !== "string" || typeof stt.duration_seconds !== "number") {
    throw new Error("STT wrapper contract changed unexpectedly.");
  }

  if (typeof tts.audio_base64 !== "string" || typeof tts.duration_seconds !== "number") {
    throw new Error("TTS wrapper contract changed unexpectedly.");
  }

  if (typeof infer.text !== "string") {
    throw new Error("Infer wrapper contract changed unexpectedly.");
  }
}

async function tts_accepts_emotional_reference_without_serializing_undefined() {
  const capturedBodies: string[] = [];
  const fetchFn: RunPodFetch = async (_input, init) => {
    capturedBodies.push(String(init?.body ?? ""));

    return new Response(JSON.stringify({ audio_base64: "Zm9v", duration_seconds: 1.11 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await synthesizeSpeech(
    {
      text: "hello",
      speaker_wav_b2_key: "voice-samples/persona/neutral.wav",
      language: "en",
      emotion_b2_key: "voice-samples/persona/warm.wav",
    },
    {
      endpointUrl: "https://example.modal.run/tts",
      fetchFn,
    },
  );

  await synthesizeSpeech(
    {
      text: "hello",
      speaker_wav_b2_key: "voice-samples/persona/neutral.wav",
      language: "en",
      emotion_b2_key: undefined,
    },
    {
      endpointUrl: "https://example.modal.run/tts",
      fetchFn,
    },
  );

  const withEmotion = JSON.parse(capturedBodies[0] ?? "{}") as Record<string, unknown>;
  const withoutEmotion = JSON.parse(capturedBodies[1] ?? "{}") as Record<string, unknown>;

  if (withEmotion.emotion_b2_key !== "voice-samples/persona/warm.wav") {
    throw new Error("Expected TTS wrapper to forward emotion_b2_key when present.");
  }

  if ("emotion_b2_key" in withoutEmotion) {
    throw new Error("Expected TTS wrapper to omit emotion_b2_key when undefined.");
  }
}

async function analyse_wrappers_post_task_input_and_unwrap_result() {
  const capturedBodies: string[] = [];
  const fetchFn: RunPodFetch = async (_input, init) => {
    const body = String(init?.body ?? "");
    capturedBodies.push(body);
    const parsed = JSON.parse(body) as { task?: string };

    if (parsed.task === "trait_inference") {
      return new Response(
        JSON.stringify({
          result: {
            openness: 0.7,
            conscientiousness: 0.6,
            extraversion: 0.5,
            agreeableness: 0.8,
            neuroticism: 0.2,
            narrative_agency: 0.65,
            narrative_communion: 0.75,
            narrative_redemption: 0.55,
            dominant_values: ["benevolence", "security", "self-direction"],
            summary_prose: "Reflective and warm.",
            identity_block: "I am reflective and warm.",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        result: {
          emotion_label: "anxious",
          intensity: 0.72,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const traits = await inferTraits("I try to do the right thing.", {
    endpointUrl: "https://example.modal.run/analyse",
    fetchFn,
  });
  const emotion = await classifyEmotion("Oh my goodness, is little Freddy okay?", {
    endpointUrl: "https://example.modal.run/analyse",
    fetchFn,
  });

  if (traits.identity_block !== "I am reflective and warm.") {
    throw new Error("Expected inferTraits to unwrap the trait inference result.");
  }

  if (emotion.emotion_label !== "anxious" || emotion.intensity !== 0.72) {
    throw new Error("Expected classifyEmotion to unwrap the emotion classification result.");
  }

  const traitRequest = JSON.parse(capturedBodies[0] ?? "{}") as Record<string, unknown>;
  const emotionRequest = JSON.parse(capturedBodies[1] ?? "{}") as Record<string, unknown>;

  if (
    traitRequest.task !== "trait_inference" ||
    traitRequest.input !== "I try to do the right thing."
  ) {
    throw new Error("Expected inferTraits to post the trait_inference task and input.");
  }

  if (
    emotionRequest.task !== "emotion_classify" ||
    emotionRequest.input !== "Oh my goodness, is little Freddy okay?"
  ) {
    throw new Error("Expected classifyEmotion to post the emotion_classify task and input.");
  }
}

async function analyse_wrappers_throw_typed_errors_for_invalid_payloads() {
  await assertRejectsWithModalError(
    () =>
      inferTraits("I try to do the right thing.", {
        endpointUrl: "https://example.modal.run/analyse",
        fetchFn: async () =>
          new Response(JSON.stringify({ error: "parse_failed" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      }),
    "parse model JSON",
  );

  await assertRejectsWithModalError(
    () =>
      classifyEmotion("Oh my goodness, is little Freddy okay?", {
        endpointUrl: "https://example.modal.run/analyse",
        fetchFn: async () =>
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      }),
    "missing result",
  );
}

async function assertRejectsWithModalError(
  action: () => Promise<unknown>,
  expectedMessage: string,
) {
  try {
    await action();
  } catch (error) {
    if (!(error instanceof ModalError)) {
      throw new Error("Expected a ModalError.");
    }

    if (!error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to include "${expectedMessage}", received "${error.message}".`,
      );
    }

    return;
  }

  throw new Error("Expected action to reject with a ModalError.");
}

async function run() {
  await client_posts_to_modal_url_with_json();
  await infer_uses_abortsignal_timeout_590_seconds();
  await wrapper_modules_preserve_contract_shapes();
  await tts_accepts_emotional_reference_without_serializing_undefined();
  await analyse_wrappers_post_task_input_and_unwrap_result();
  await analyse_wrappers_throw_typed_errors_for_invalid_payloads();
}

void run();
