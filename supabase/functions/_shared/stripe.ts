import Stripe from "npm:stripe@17.7.0";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface BillingProfile {
  id: string;
  email: string;
  credits: number;
  stripe_customer_id: string | null;
  plan: string;
  subscription_status: string | null;
}

export function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

export function createStripeClient(): Stripe {
  return new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2024-06-20",
  });
}

export function createAdminClient(): SupabaseClient {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function getAppUrl(): string {
  return (
    Deno.env.get("APP_URL")?.trim() ??
    Deno.env.get("SITE_URL")?.trim() ??
    "http://localhost:5173"
  );
}

export async function findProfileByUserId(
  adminClient: SupabaseClient,
  userId: string,
): Promise<BillingProfile | null> {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, credits, stripe_customer_id, plan, subscription_status")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as BillingProfile | null;
}

export async function findProfileByCustomerId(
  adminClient: SupabaseClient,
  customerId: string,
): Promise<BillingProfile | null> {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, credits, stripe_customer_id, plan, subscription_status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as BillingProfile | null;
}

export async function upsertStripeCustomerId(
  adminClient: SupabaseClient,
  userId: string,
  customerId: string,
): Promise<void> {
  const { error } = await adminClient
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function upsertSubscriptionRecord(
  adminClient: SupabaseClient,
  payload: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    plan: string;
  },
): Promise<void> {
  const { error: subscriptionError } = await adminClient
    .from("subscriptions")
    .upsert({
      user_id: payload.userId,
      stripe_customer_id: payload.stripeCustomerId,
      stripe_subscription_id: payload.stripeSubscriptionId,
      stripe_price_id: payload.stripePriceId,
      status: payload.status,
      current_period_start: payload.currentPeriodStart,
      current_period_end: payload.currentPeriodEnd,
      cancel_at_period_end: payload.cancelAtPeriodEnd,
    }, {
      onConflict: "stripe_subscription_id",
    });

  if (subscriptionError) {
    throw subscriptionError;
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      plan: payload.plan,
      subscription_status: payload.status,
      current_period_end: payload.currentPeriodEnd,
      stripe_customer_id: payload.stripeCustomerId,
    })
    .eq("id", payload.userId);

  if (profileError) {
    throw profileError;
  }
}
