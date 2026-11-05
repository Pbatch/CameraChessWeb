import { describe, expect, it } from "vitest";
import { formatTime } from "./formatTime";

describe("formatTime", () => {
  it("formats as YouTube does", () => {
    expect(formatTime(7.9)).toBe("0:07");
    expect(formatTime(754)).toBe("12:34");
    expect(formatTime(3723)).toBe("1:02:03");
  });

  it("shows 0:00 before the duration is known", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});
