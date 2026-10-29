import { beforeEach, describe, expect, it } from "vitest";
import { errorClear, errorShow } from "./errorSlice";
import { useStore } from "../store";

const getErrors = () => useStore.getState().errors;

beforeEach(() => {
  useStore.setState(useStore.getInitialState(), true);
});

describe("errorSlice", () => {
  it("keeps one error per source, newest last", () => {
    errorShow({ source: "stream", message: "Reconnecting" });
    errorShow({ source: "move", message: "Retrying" });
    errorShow({ source: "stream", message: "Gone" });
    expect(getErrors()).toEqual([
      { source: "move", message: "Retrying" },
      { source: "stream", message: "Gone" }
    ]);
  });

  it("clears only the given source", () => {
    errorShow({ source: "login", message: "Login failed" });
    errorShow({ source: "stream", message: "Reconnecting" });
    errorClear("stream");
    expect(getErrors()).toEqual([{ source: "login", message: "Login failed" }]);
  });

  it("leaves the state unchanged when there is nothing to clear", () => {
    errorShow({ source: "login", message: "Login failed" });
    const errors = getErrors();
    errorClear("stream");
    expect(getErrors()).toBe(errors);
  });
});
