import { describe, expect, it } from "vitest";
import { QUESTIONS, SECTIONS } from "./faq";

describe("FAQ sections", () => {
  it("hold every question exactly once", () => {
    const sorted = SECTIONS.flatMap(({ questions }) => questions);
    expect([...sorted].sort()).toEqual([...QUESTIONS].sort());
  });
});
