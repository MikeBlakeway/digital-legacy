import {
  callRunPodEndpoint,
  type RunPodFetch,
} from "@/lib/ai/client";
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

async function run() {
  await client_posts_to_modal_url_with_json();
  await infer_uses_abortsignal_timeout_590_seconds();
  await wrapper_modules_preserve_contract_shapes();
  await tts_accepts_emotional_reference_without_serializing_undefined();
}

void run();
