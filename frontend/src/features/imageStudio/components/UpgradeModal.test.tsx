import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UpgradeModal } from "./UpgradeModal";

describe("UpgradeModal", () => {
  it("triggers checkout when the primary upgrade button is clicked", async () => {
    const user = userEvent.setup();
    const onUpgrade = vi.fn();

    render(
      <UpgradeModal
        onClose={vi.fn()}
        onUpgrade={onUpgrade}
        open
      />,
    );

    await user.click(screen.getByRole("button", { name: /立即升级/i }));

    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it("shows the loading state while Stripe Checkout is opening", () => {
    render(
      <UpgradeModal
        isSubmitting
        onClose={vi.fn()}
        onUpgrade={vi.fn()}
        open
      />,
    );

    expect(screen.getByRole("button", { name: /正在跳转支付/i })).toBeDisabled();
  });
});
