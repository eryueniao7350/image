import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createAdminClient,
  createStripeClient,
  findProfileByUserId,
  getAppUrl,
  getRequiredEnv,
} from "../_shared/stripe.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ message: "Only POST requests are supported." }, 405);
  }

  try {
    const supabase = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_ANON_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
      },
    );
    const adminClient = createAdminClient();
    const stripe = createStripeClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return json({ message: "Please sign in first." }, 401);
    }

    const profile = await findProfileByUserId(adminClient, user.id);
    if (!profile?.stripe_customer_id) {
      return json({ message: "No active billing profile was found." }, 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getAppUrl()}/studio`,
    });

    return json({ url: session.url });
  } catch (error) {
    console.error("create-portal-session failed", error);
    return json({ message: "Unable to open billing portal right now." }, 500);
  }
});
