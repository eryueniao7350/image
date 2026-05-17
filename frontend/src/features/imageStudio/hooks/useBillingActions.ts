import { useState } from "react";
import {
  createCheckoutSession,
  createPortalSession,
  type StudioApiError,
} from "../api";
import { redirectToBillingUrl } from "../billing";

type BillingAction = "checkout" | "portal" | null;

function getBillingErrorMessage(error: unknown, fallback: string) {
  const billingError = error as StudioApiError | undefined;
  return billingError?.message || fallback;
}

export function useBillingActions() {
  const [activeAction, setActiveAction] = useState<BillingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startCheckout = async () => {
    if (activeAction) {
      return;
    }

    setActiveAction("checkout");
    setErrorMessage(null);

    try {
      const session = await createCheckoutSession();

      if (!session.url) {
        throw new Error("支付页面地址为空。");
      }

      redirectToBillingUrl(session.url);
    } catch (error) {
      setErrorMessage(getBillingErrorMessage(error, "当前无法打开升级支付页面。"));
    } finally {
      setActiveAction(null);
    }
  };

  const openCustomerPortal = async () => {
    if (activeAction) {
      return;
    }

    setActiveAction("portal");
    setErrorMessage(null);

    try {
      const session = await createPortalSession();

      if (!session.url) {
        throw new Error("订阅管理页面地址为空。");
      }

      redirectToBillingUrl(session.url);
    } catch (error) {
      setErrorMessage(getBillingErrorMessage(error, "当前无法打开订阅管理页面。"));
    } finally {
      setActiveAction(null);
    }
  };

  return {
    activeAction,
    errorMessage,
    clearError: () => setErrorMessage(null),
    isCheckingOut: activeAction === "checkout",
    isOpeningPortal: activeAction === "portal",
    openCustomerPortal,
    startCheckout,
  };
}
