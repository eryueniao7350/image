/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// This repo does not install Vitest yet, so this file is aligned to the intended
// future jsdom test setup and cannot be executed in the current package state.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GenerationForm } from "./GenerationForm";

describe("GenerationForm", () => {
  it("shows a locked submit button while generation is running", () => {
    render(
      <GenerationForm
        isSubmitting
        onSubmit={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /generating image/i });

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Generating image...");
  });

  it("shows an active submit button when generation is idle", () => {
    render(
      <GenerationForm
        isSubmitting={false}
        onSubmit={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /generate image/i });

    expect(button).toBeEnabled();
  });
});
