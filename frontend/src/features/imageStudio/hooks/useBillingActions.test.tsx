import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createCheckoutSession, createPortalSession } from "../api";
import { redirectToBillingUrl } from "../billing";
import { useBillingActions } from "./useBillingActions";

vi.mock("../api", () => ({
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
}));

vi.mock("../billing", () => ({
  redirectToBillingUrl: vi.fn(),
}));

describe("useBillingActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts Stripe Checkout and redirects to the returned url", async () => {
    vi.mocked(createCheckoutSession).mockResolvedValue({
      sessionId: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });

    const { result } = renderHook(() => useBillingActions());

    await act(async () => {
      await result.current.startCheckout();
    });

    expect(createCheckoutSession).toHaveBeenCalledTimes(1);
    expect(redirectToBillingUrl).toHaveBeenCalledWith("https://checkout.stripe.com/pay/cs_test_123");
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isCheckingOut).toBe(false);
  });

  it("shows a friendly error when Stripe Checkout cannot be opened", async () => {
    vi.mocked(createCheckoutSession).mockRejectedValue(new Error("Stripe Checkout 暂时不可用"));

    const { result } = renderHook(() => useBillingActions());

    await act(async () => {
      await result.current.startCheckout();
    });

    expect(redirectToBillingUrl).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe("Stripe Checkout 暂时不可用");
    expect(result.current.isCheckingOut).toBe(false);
  });

  it("opens the Stripe customer portal and redirects to the returned url", async () => {
    vi.mocked(createPortalSession).mockResolvedValue({
      url: "https://billing.stripe.com/session/test_portal",
    });

    const { result } = renderHook(() => useBillingActions());

    await act(async () => {
      await result.current.openCustomerPortal();
    });

    await waitFor(() => {
      expect(createPortalSession).toHaveBeenCalledTimes(1);
    });
    expect(redirectToBillingUrl).toHaveBeenCalledWith("https://billing.stripe.com/session/test_portal");
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isOpeningPortal).toBe(false);
  });
});
