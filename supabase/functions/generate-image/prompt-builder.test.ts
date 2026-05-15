import { buildPrompt } from "./prompt-builder.ts";

function assertEquals<T>(actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(
      `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
    );
  }
}

function assertStringIncludes(actual: string, expected: string) {
  if (!actual.includes(expected)) {
    throw new Error(
      `Expected string to include ${JSON.stringify(expected)} but got ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("buildPrompt includes structured sections", () => {
  const result = buildPrompt({
    imageType: "xiaohongshu-cover",
    aspectRatio: "3:4",
    style: "premium, refined, modern aesthetic",
    scene: "indoor window-side cafe setting",
    whitespace:
      "reserve clean negative space at the top for headline placement",
    subjectText: "a young woman holding coffee beside a bright window",
    extraRequirements: "suitable for a creator cover, keep colors clean",
  });

  assertStringIncludes(
    result,
    "Primary subject: a young woman holding coffee beside a bright window.",
  );
  assertStringIncludes(result, "Aspect ratio target: 3:4.");
  assertStringIncludes(
    result,
    "reserve clean negative space at the top for headline placement",
  );
  assertStringIncludes(
    result,
    "Additional requirements: suitable for a creator cover, keep colors clean.",
  );
});

Deno.test("buildPrompt omits empty extra requirements", () => {
  const result = buildPrompt({
    imageType: "poster",
    aspectRatio: "1:1",
    style: "minimal",
    scene: "plain backdrop",
    whitespace: "no visible whitespace",
    subjectText: "a ceramic mug on a table",
    extraRequirements: "",
  });

  assertEquals(result.includes("Additional requirements:"), false);
});
