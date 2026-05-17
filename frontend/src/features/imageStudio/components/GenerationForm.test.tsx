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

    const button = screen.getByRole("button", { name: /正在生成图片/i });

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("正在生成图片...");
  });

  it("shows an active submit button when generation is idle", () => {
    render(
      <GenerationForm
        isSubmitting={false}
        onSubmit={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /生成图片/i });

    expect(button).toBeEnabled();
  });

  it("submits trimmed values from the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<GenerationForm isSubmitting={false} onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText(/主体或标题方向/i));
    await user.type(screen.getByLabelText(/主体或标题方向/i), "  新内容发布宣传图  ");

    await user.clear(screen.getByLabelText(/场景或环境/i));
    await user.type(screen.getByLabelText(/场景或环境/i), "  温暖的棚拍场景  ");

    await user.clear(screen.getByLabelText(/构图与留白/i));
    await user.type(screen.getByLabelText(/构图与留白/i), "  为标题预留空间  ");

    await user.type(screen.getByLabelText(/补充要求/i), "  使用暖色高光  ");

    await user.click(screen.getByRole("button", { name: /生成图片/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      imageType: "social-visual",
      aspectRatio: "1:1",
      style: "product",
      scene: "温暖的棚拍场景",
      whitespace: "为标题预留空间",
      subjectText: "新内容发布宣传图",
      extraRequirements: "使用暖色高光",
    });
  });

  it("applies prompt examples to the editable fields", async () => {
    const user = userEvent.setup();

    render(<GenerationForm isSubmitting={false} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /使用“创作者肖像”/i }));

    expect(screen.getByLabelText(/主体或标题方向/i)).toHaveValue("创作者肖像");
    expect(screen.getByLabelText(/场景或环境/i)).toHaveValue(
      "在温暖摄影棚中的自信创作者，自然侧光，编辑感肖像构图，带纹理背景，姿态放松。",
    );
    expect(screen.getByLabelText(/风格预设/i)).toHaveValue("portrait");
    expect(screen.getByLabelText(/图片比例/i)).toHaveValue("3:4");
  });
});
