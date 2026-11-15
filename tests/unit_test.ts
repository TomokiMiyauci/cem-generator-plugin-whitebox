import { expect, test } from "bun:test";
import { loadCases } from "./case.ts";
import { generateCem } from "@wc-toolkit/cem-generator";
import { whiteboxPlugins } from "../src/mod.ts";

const cases = await loadCases("./tests/cases");

for (const testCase of cases) {
  test(testCase.name, async () => {
    const pkg = generateCem({
      include: testCase.inputs,
      plugins: whiteboxPlugins(),
    });

    expect(normalize(pkg)).toEqual(testCase.expected);
  });
}

function normalize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(normalize) as T;
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, normalize(value)]),
    ) as T;
  }

  return value;
}
