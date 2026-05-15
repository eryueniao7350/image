import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("submits trimmed values from the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<GenerationForm isSubmitting={false} onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText(/subject or headline idea/i));
    await user.type(screen.getByLabelText(/subject or headline idea/i), "  Launch graphic  ");

    await user.clear(screen.getByLabelText(/scene or environment/i));
    await user.type(screen.getByLabelText(/scene or environment/i), "  Cozy studio set  ");

    await user.clear(screen.getByLabelText(/composition and whitespace/i));
    await user.type(screen.getByLabelText(/composition and whitespace/i), "  Leave room for title  ");

    await user.type(screen.getByLabelText(/extra requirements/i), "  Use warm highlights  ");

    await user.click(screen.getByRole("button", { name: /generate image/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      imageType: "social-visual",
      aspectRatio: "1:1",
      style: "product",
      scene: "Cozy studio set",
      whitespace: "Leave room for title",
      subjectText: "Launch graphic",
      extraRequirements: "Use warm highlights",
    });
  });

  it("applies prompt examples to the editable fields", async () => {
    const user = userEvent.setup();

    render(<GenerationForm isSubmitting={false} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /use creator portrait/i }));

    expect(screen.getByLabelText(/subject or headline idea/i)).toHaveValue("Creator portrait");
    expect(screen.getByLabelText(/scene or environment/i)).toHaveValue(
      "Confident creator in a warm studio, natural side light, editorial portrait composition, textured background, relaxed posture.",
    );
    expect(screen.getByLabelText(/style preset/i)).toHaveValue("portrait");
    expect(screen.getByLabelText(/aspect ratio/i)).toHaveValue("3:4");
  });
});
