import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { corsHeaders } from "../_shared/cors.ts";
import { buildPrompt, type PromptInput } from "./prompt-builder.ts";

type GenerateImageRequest = PromptInput;

type ErrorCode =
  | "GENERATION_FAILED"
  | "INSUFFICIENT_CREDITS"
  | "INVALID_REQUEST"
  | "RESERVATION_FAILED"
  | "UNAUTHENTICATED";

interface ErrorResponse {
  code: ErrorCode;
  message: string;
}

interface SuccessResponse {
  imageUrl: string;
  prompt: string;
  creditsRemaining: number;
  generationId: string;
  warning?: {
    code: "PERSISTENCE_INCOMPLETE";
    message: string;
  };
}

interface ReservationRow {
  generation_id: string;
  credits_remaining: number;
}

interface OpenAIImageResponse {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

const sizeMap: Record<string, string> = {
  "1:1": "1024x1024",
  "3:4": "1024x1536",
  "4:3": "1536x1024",
  "9:16": "1024x1536",
  "16:9": "1536x1024",
};
const openAiTimeoutMs = 45_000;
const allowedAspectRatios = new Set(Object.keys(sizeMap));

function json(data: ErrorResponse | SuccessResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBody(body: unknown): GenerateImageRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as Partial<GenerateImageRequest>;

  if (
    !isNonEmptyString(candidate.imageType) ||
    !isNonEmptyString(candidate.aspectRatio) ||
    !isNonEmptyString(candidate.style) ||
    !isNonEmptyString(candidate.scene) ||
    !isNonEmptyString(candidate.whitespace) ||
    !isNonEmptyString(candidate.subjectText)
  ) {
    return null;
  }

  if (
    candidate.extraRequirements !== undefined &&
    typeof candidate.extraRequirements !== "string"
  ) {
    return null;
  }

  return {
    imageType: candidate.imageType.trim(),
    aspectRatio: candidate.aspectRatio.trim(),
    style: candidate.style.trim(),
    scene: candidate.scene.trim(),
    whitespace: candidate.whitespace.trim(),
    subjectText: candidate.subjectText.trim(),
    extraRequirements: candidate.extraRequirements?.trim() ?? "",
  };
}

function isAllowedAspectRatio(aspectRatio: string): boolean {
  return allowedAspectRatios.has(aspectRatio);
}

function createUserClient(req: Request, supabaseUrl: string, anonKey: string) {
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });
}

function createAdminClient(
  supabaseUrl: string,
  serviceRoleKey: string,
): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function markGenerationStatus(
  adminClient: SupabaseClient,
  generationId: string,
  updates: {
    status: "failed" | "succeeded";
    image_url?: string;
    final_prompt?: string;
  },
): Promise<boolean> {
  const { error } = await adminClient
    .from("generations")
    .update(updates)
    .eq("id", generationId);

  if (error) {
    console.error("Failed to update generation status", {
      generationId,
      updates,
      error,
    });
    return false;
  }

  return true;
}

function getImageUrl(payload: OpenAIImageResponse): string {
  const item = payload.data?.[0];

  if (!item) {
    return "";
  }

  if (item.url) {
    return item.url;
  }

  if (item.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }

  return "";
}

function mapReservationError(
  error: { message?: string } | null,
): ErrorResponse {
  const message = error?.message ?? "";

  if (
    message.includes("INSUFFICIENT_CREDITS") ||
    message.includes("PROFILE_NOT_FOUND")
  ) {
    return {
      code: "INSUFFICIENT_CREDITS",
      message: "You need more credits to generate.",
    };
  }

  if (message.includes("UNAUTHORIZED")) {
    return {
      code: "UNAUTHENTICATED",
      message: "Please sign in first.",
    };
  }

  return {
    code: "RESERVATION_FAILED",
    message: "Unable to reserve generation credits.",
  };
}

function generationFailedResponse(
  message = "Image generation failed.",
): Response {
  return json({ code: "GENERATION_FAILED", message }, 502);
}

function reservationFailedResponse(
  message = "Unable to complete image generation at the moment.",
): Response {
  return json({ code: "RESERVATION_FAILED", message }, 500);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(
      { code: "INVALID_REQUEST", message: "Only POST requests are supported." },
      405,
    );
  }

  let supabaseUrl: string;
  let anonKey: string;
  let serviceRoleKey: string;
  let openAiApiKey: string;

  try {
    supabaseUrl = getRequiredEnv("SUPABASE_URL");
    anonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    openAiApiKey = getRequiredEnv("OPENAI_API_KEY");
  } catch (error) {
    console.error(error);
    return json(
      {
        code: "GENERATION_FAILED",
        message: "Image generation is currently unavailable.",
      },
      500,
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return json(
      { code: "INVALID_REQUEST", message: "Request body must be valid JSON." },
      400,
    );
  }

  const body = parseBody(rawBody);
  if (!body) {
    return json(
      {
        code: "INVALID_REQUEST",
        message: "Missing or invalid image generation fields.",
      },
      400,
    );
  }

  if (!isAllowedAspectRatio(body.aspectRatio)) {
    return json(
      {
        code: "INVALID_REQUEST",
        message: "aspectRatio must be one of 1:1, 3:4, 4:3, 9:16, or 16:9.",
      },
      400,
    );
  }

  const supabase = createUserClient(req, supabaseUrl, anonKey);
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return json(
      { code: "UNAUTHENTICATED", message: "Please sign in first." },
      401,
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, credits")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Failed to load profile before credit check", profileError);
    return reservationFailedResponse("Unable to verify credits right now.");
  }

  if (!profile) {
    return reservationFailedResponse("Unable to verify credits right now.");
  }

  if (profile.credits < 1) {
    return json(
      {
        code: "INSUFFICIENT_CREDITS",
        message: "You need more credits to generate.",
      },
      402,
    );
  }

  const prompt = buildPrompt(body);

  const { data: reservation, error: reservationError } = await supabase.rpc(
    "consume_credit_and_create_generation",
    {
      p_user_id: user.id,
      p_image_type: body.imageType,
      p_aspect_ratio: body.aspectRatio,
      p_style: body.style,
      p_scene: body.scene,
      p_whitespace: body.whitespace,
      p_subject_text: body.subjectText,
      p_extra_requirements: body.extraRequirements,
      p_final_prompt: prompt,
    },
  );

  if (reservationError) {
    const mapped = mapReservationError(reservationError);
    const status = mapped.code === "INSUFFICIENT_CREDITS"
      ? 402
      : mapped.code === "UNAUTHENTICATED"
      ? 401
      : 500;

    return json(mapped, status);
  }

  const generation = (reservation as ReservationRow[] | null)?.[0];

  if (!generation) {
    return json(
      {
        code: "RESERVATION_FAILED",
        message: "Unable to reserve generation credits.",
      },
      500,
    );
  }

  let openAiResponse: Response;
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), openAiTimeoutMs);
  try {
    openAiResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        signal: abortController.signal,
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: sizeMap[body.aspectRatio],
        }),
      },
    );
  } catch (error) {
    console.error("OpenAI generation request failed", error);
    const failedPersisted = await markGenerationStatus(
      adminClient,
      generation.generation_id,
      { status: "failed" },
    );

    if (!failedPersisted) {
      return generationFailedResponse(
        "Image generation failed and the failure state could not be recorded.",
      );
    }

    return generationFailedResponse();
  } finally {
    clearTimeout(timeoutId);
  }

  if (!openAiResponse.ok) {
    const details = await openAiResponse.text().catch(() => "");
    console.error("OpenAI generation returned non-OK response", {
      status: openAiResponse.status,
      details,
    });
    const failedPersisted = await markGenerationStatus(
      adminClient,
      generation.generation_id,
      { status: "failed" },
    );

    if (!failedPersisted) {
      return generationFailedResponse(
        "Image generation failed and the failure state could not be recorded.",
      );
    }

    return generationFailedResponse();
  }

  let payload: OpenAIImageResponse;
  try {
    payload = await openAiResponse.json() as OpenAIImageResponse;
  } catch (error) {
    console.error("OpenAI generation returned invalid JSON", error);
    const failedPersisted = await markGenerationStatus(
      adminClient,
      generation.generation_id,
      { status: "failed" },
    );

    if (!failedPersisted) {
      return generationFailedResponse(
        "Image generation failed and the failure state could not be recorded.",
      );
    }

    return generationFailedResponse();
  }

  const imageUrl = getImageUrl(payload);

  if (!imageUrl) {
    console.error(
      "OpenAI generation response did not include an image",
      payload,
    );
    const failedPersisted = await markGenerationStatus(
      adminClient,
      generation.generation_id,
      { status: "failed" },
    );

    if (!failedPersisted) {
      return generationFailedResponse(
        "Image generation failed and the failure state could not be recorded.",
      );
    }

    return generationFailedResponse();
  }

  const succeededPersisted = await markGenerationStatus(
    adminClient,
    generation.generation_id,
    {
      status: "succeeded",
      image_url: imageUrl,
      final_prompt: prompt,
    },
  );

  if (!succeededPersisted) {
    return json({
      imageUrl,
      prompt,
      creditsRemaining: generation.credits_remaining,
      generationId: generation.generation_id,
      warning: {
        code: "PERSISTENCE_INCOMPLETE",
        message:
          "Image generation completed, but the result could not be saved to history. Please keep this image before leaving the page.",
      },
    });
  }

  return json({
    imageUrl,
    prompt,
    creditsRemaining: generation.credits_remaining,
    generationId: generation.generation_id,
  });
});
