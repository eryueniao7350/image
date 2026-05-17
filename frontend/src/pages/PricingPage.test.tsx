import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../contexts/AuthContext";
import { useBillingActions } from "../features/imageStudio/hooks/useBillingActions";
import { PricingPage } from "./PricingPage";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/imageStudio/hooks/useBillingActions", () => ({
  useBillingActions: vi.fn(),
}));

describe("PricingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks anonymous visitors to sign in before upgrading", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithMagicLink: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(useBillingActions).mockReturnValue({
      activeAction: null,
      clearError: vi.fn(),
      errorMessage: null,
      isCheckingOut: false,
      isOpeningPortal: false,
      openCustomerPortal: vi.fn(),
      startCheckout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PricingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /先登录再升级/i })).toHaveAttribute(
      "href",
      "/login?next=%2Fpricing",
    );
  });

  it("wires the upgrade and subscription buttons for signed-in users", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn();
    const openCustomerPortal = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-123" } as User,
      session: null,
      loading: false,
      signInWithMagicLink: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(useBillingActions).mockReturnValue({
      activeAction: null,
      clearError: vi.fn(),
      errorMessage: null,
      isCheckingOut: false,
      isOpeningPortal: false,
      openCustomerPortal,
      startCheckout,
    });

    render(
      <MemoryRouter>
        <PricingPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /立即升级 Pro/i }));
    await user.click(screen.getByRole("button", { name: /管理订阅/i }));

    expect(startCheckout).toHaveBeenCalledTimes(1);
    expect(openCustomerPortal).toHaveBeenCalledTimes(1);
  });
});
