import { describe, expect, it } from "vitest";
import { resources } from "./index";

type Strings = { [key: string]: string | Strings };

// Every string, by its dotted key
const flatten = (strings: Strings, prefix = ""): Map<string, string> => {
  const flat = new Map<string, string>();
  for (const [key, value] of Object.entries(strings)) {
    if (typeof value === "string") {
      flat.set(prefix + key, value);
    } else {
      for (const [k, v] of flatten(value, `${prefix}${key}.`)) flat.set(k, v);
    }
  }
  return flat;
};

// The parts a translation must keep as they are: {{placeholders}} and the FAQ's <tags>, in any order
const fixedParts = (text: string): string[] => (text.match(/\{\{\w+\}\}|<\/?\w+>/g) ?? []).sort();

const english = flatten(resources.en.translation);
const others = Object.entries(resources).filter(([language]) => language !== "en");

describe.each(others)("%s strings", (_, { translation }) => {
  const strings = flatten(translation);

  it("have every English key and no others", () => {
    expect([...strings.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("are all filled in", () => {
    expect([...strings].filter(([, text]) => text.trim() === "").map(([key]) => key)).toEqual([]);
  });

  it("keep the English placeholders and tags", () => {
    const mismatched = [...english].filter(([key, text]) =>
      strings.has(key) && fixedParts(strings.get(key) ?? "").join() !== fixedParts(text).join());
    expect(mismatched.map(([key]) => key)).toEqual([]);
  });
});
