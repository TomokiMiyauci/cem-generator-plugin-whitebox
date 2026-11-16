import { test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { join } from "node:path";
import { loadCases } from "./case.ts";
import { generateCem } from "@wc-toolkit/cem-generator";
import { whiteboxPlugins } from "../src/mod.ts";

const cases = await loadCases(join(import.meta.dirname, "./cases/"));

for (const testCase of cases) {
  await test(testCase.name, () => {
    const pkg = generateCem({
      include: testCase.inputs,
      plugins: whiteboxPlugins(),
    });

    deepStrictEqual(normalize(pkg), testCase.expected);
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
