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

export interface StudioApiError extends Error {
  code?: string;
  status?: number;
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
