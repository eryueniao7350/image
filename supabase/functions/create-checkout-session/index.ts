import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createAdminClient,
  createStripeClient,
  findProfileByUserId,
  getAppUrl,
  getRequiredEnv,
  upsertStripeCustomerId,
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
    const appUrl = getAppUrl();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return json({ message: "Please sign in first." }, 401);
    }

    const profile = await findProfileByUserId(adminClient, user.id);
    if (!profile) {
      return json({ message: "Profile not found." }, 404);
    }

    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          user_id: profile.id,
        },
      });
      customerId = customer.id;
      await upsertStripeCustomerId(adminClient, profile.id, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: getRequiredEnv("STRIPE_PRICE_PRO_MONTHLY"),
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/studio?billing=success`,
      cancel_url: `${appUrl}/pricing?billing=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        user_id: profile.id,
        plan: "pro_monthly",
      },
      subscription_data: {
        metadata: {
          user_id: profile.id,
          plan: "pro_monthly",
        },
      },
    });

    return json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("create-checkout-session failed", error);
    return json({ message: "Unable to start checkout right now." }, 500);
  }
});
