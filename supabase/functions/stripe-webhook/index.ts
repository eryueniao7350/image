import Stripe from "npm:stripe@17.7.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createAdminClient,
  createStripeClient,
  findProfileByCustomerId,
  getRequiredEnv,
  upsertSubscriptionRecord,
} from "../_shared/stripe.ts";

const MONTHLY_CREDITS = 100;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function toIso(ts: number | null | undefined): string | null {
  return ts ? new Date(ts * 1000).toISOString() : null;
}

async function grantRenewalCredits(params: {
  adminClient: ReturnType<typeof createAdminClient>;
  userId: string;
  eventId: string;
  customerId: string | null;
  subscriptionId: string | null;
  invoiceId: string | null;
  payload: Record<string, unknown>;
}) {
  const { error } = await params.adminClient.rpc("grant_credits_from_billing", {
    p_user_id: params.userId,
    p_amount: MONTHLY_CREDITS,
    p_reason: "subscription_renewal",
    p_stripe_event_id: params.eventId,
    p_event_type: "invoice.paid",
    p_stripe_customer_id: params.customerId,
    p_stripe_subscription_id: params.subscriptionId,
    p_stripe_invoice_id: params.invoiceId,
    p_payload: params.payload,
  });

  if (error) {
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ message: "Only POST requests are supported." }, 405);
  }

  try {
    const stripe = createStripeClient();
    const adminClient = createAdminClient();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = getRequiredEnv("STRIPE_WEBHOOK_SECRET");

    if (!signature) {
      return json({ message: "Missing Stripe signature." }, 400);
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;
        const customerId = typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;

        if (userId && subscriptionId && customerId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertSubscriptionRecord(adminClient, {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id ?? "",
            status: subscription.status,
            currentPeriodStart: toIso(subscription.current_period_start),
            currentPeriodEnd: toIso(subscription.current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            plan: "pro_monthly",
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? null;
        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id ?? null;

        if (!customerId) {
          break;
        }

        const profile = await findProfileByCustomerId(adminClient, customerId);
        if (!profile) {
          break;
        }

        await grantRenewalCredits({
          adminClient,
          userId: profile.id,
          eventId: event.id,
          customerId,
          subscriptionId,
          invoiceId: invoice.id,
          payload: invoice as unknown as Record<string, unknown>,
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
        const profile = await findProfileByCustomerId(adminClient, customerId);
        if (!profile) {
          break;
        }

        await upsertSubscriptionRecord(adminClient, {
          userId: profile.id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id ?? "",
          status: subscription.status,
          currentPeriodStart: toIso(subscription.current_period_start),
          currentPeriodEnd: toIso(subscription.current_period_end),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          plan: subscription.status === "active" ? "pro_monthly" : "free",
        });
        break;
      }

      default:
        break;
    }

    return json({ received: true });
  } catch (error) {
    console.error("stripe-webhook failed", error);
    return json({ message: "Webhook handling failed." }, 400);
  }
});
