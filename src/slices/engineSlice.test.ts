import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../store";
import { engineChoiceClear, engineToggle, isEngineOn } from "./engineSlice";

const on = (mode: Parameters<typeof isEngineOn>[0]) => isEngineOn(mode, useStore.getState().engineChoice);

describe("engine switch", () => {
  beforeEach(() => {
    engineChoiceClear();
  });

  it("starts on for uploads and off for the camera modes", () => {
    expect(on("upload")).toBe(true);
    expect(on("record")).toBe(false);
    expect(on("broadcast")).toBe(false);
  });

  it("switches for the mode it was switched in only", () => {
    engineToggle("upload");
    expect(on("upload")).toBe(false);
    expect(on("record")).toBe(false);

    engineToggle("record");
    expect(on("record")).toBe(true);
    // A choice in one mode doesn't carry over to another
    expect(on("upload")).toBe(true);
  });

  it("is never on in play mode", () => {
    engineToggle("play");
    expect(on("play")).toBe(false);
  });

  it("goes back to the default once cleared", () => {
    engineToggle("upload");
    engineChoiceClear();
    expect(on("upload")).toBe(true);
  });

  it("clears only the mode it's asked to", () => {
    engineToggle("record");
    engineChoiceClear("upload");
    expect(on("record")).toBe(true);
    engineChoiceClear("record");
    expect(on("record")).toBe(false);
  });
});
