import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { ImageAspectRatio, ImageGenerationStyle } from "./types";

export interface ProfileRecord {
  id: string;
  email: string;
  credits: number;
}

export interface GenerationFormValues {
  imageType: string;
  aspectRatio: ImageAspectRatio;
  style: ImageGenerationStyle;
  scene: string;
  whitespace: string;
  subjectText: string;
  extraRequirements: string;
}

export interface GenerationResultRecord {
  imageUrl: string;
  prompt: string;
  creditsRemaining: number;
  generationId: string;
  warning?: {
    code: "PERSISTENCE_INCOMPLETE";
    message: string;
  };
}

export interface GenerationHistoryRecord {
  id: string;
  imageType: string;
  aspectRatio: string;
  style: string;
  scene: string;
  whitespace: string;
  subjectText: string;
  extraRequirements: string;
  finalPrompt: string | null;
  imageUrl: string | null;
  status: "pending" | "succeeded" | "failed";
  creditCost: number;
  createdAt: string;
}

export interface StudioApiError extends Error {
  code?: string;
  status?: number;
}

export interface BillingSessionRecord {
  url: string;
  sessionId?: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function createStudioError(message: string, code?: string, status?: number): StudioApiError {
  const error = new Error(message) as StudioApiError;
  error.code = code;
  error.status = status;
  return error;
}

async function normalizeFunctionError(error: unknown): Promise<StudioApiError> {
  if (error instanceof FunctionsHttpError) {
    const payload = await error.context.json().catch(() => null) as
      | { code?: string; message?: string }
      | null;

    return createStudioError(
      payload?.message ?? error.message,
      payload?.code,
      error.context.status,
    );
  }

  if (error instanceof Error) {
    return createStudioError(error.message);
  }

  return createStudioError("Something went wrong. Please try again.");
}

export async function fetchMyProfile(): Promise<ProfileRecord> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("id, email, credits")
    .single();

  if (error) {
    const isMissingProfile =
      error.code === "PGRST116" ||
      error.message.toLowerCase().includes("0 rows") ||
      error.message.toLowerCase().includes("no rows");

    if (isMissingProfile) {
      throw createStudioError(
        "We could not find your studio profile yet. Try reloading in a moment.",
        "PROFILE_NOT_READY",
      );
    }

    throw createStudioError(error.message, error.code);
  }

  return data as ProfileRecord;
}

export async function fetchGenerationHistory(): Promise<GenerationHistoryRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("generations")
    .select(
      "id, image_type, aspect_ratio, style, scene, whitespace, subject_text, extra_requirements, final_prompt, image_url, status, credit_cost, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    throw createStudioError(error.message, error.code);
  }

  return (data ?? []).map((record) => ({
    id: record.id as string,
    imageType: record.image_type as string,
    aspectRatio: record.aspect_ratio as string,
    style: record.style as string,
    scene: record.scene as string,
    whitespace: record.whitespace as string,
    subjectText: record.subject_text as string,
    extraRequirements: record.extra_requirements as string,
    finalPrompt: (record.final_prompt as string | null) ?? null,
    imageUrl: (record.image_url as string | null) ?? null,
    status: record.status as GenerationHistoryRecord["status"],
    creditCost: record.credit_cost as number,
    createdAt: record.created_at as string,
  }));
}

export async function generateImage(
  input: GenerationFormValues,
): Promise<GenerationResultRecord> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("generate-image", {
    body: input,
  });

  if (error) {
    throw await normalizeFunctionError(error);
  }

  return data as GenerationResultRecord;
}

export async function createCheckoutSession(): Promise<BillingSessionRecord> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("create-checkout-session");

  if (error) {
    throw await normalizeFunctionError(error);
  }

  return data as BillingSessionRecord;
}

export async function createPortalSession(): Promise<BillingSessionRecord> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("create-portal-session");

  if (error) {
    throw await normalizeFunctionError(error);
  }

  return data as BillingSessionRecord;
}
