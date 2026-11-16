import { dirname, join, resolve } from "node:path";
import { type Package } from "custom-elements-manifest";
import { glob, readFile } from "node:fs/promises";

export interface CaseDefinition {
  name: string;
  inputs: string[];
  modules: Package["modules"];
}

export interface TestCase {
  name: string;
  inputs: string[];
  expected: Package;
}

export async function loadCases(directory: string): Promise<TestCase[]> {
  const iter = glob("**/*.json", { cwd: directory });
  const files: string[] = [];

  for await (const file of iter) {
    files.push(join(directory, file));
  }

  files.sort();

  return Promise.all(
    files.map(async (file) => {
      const path = resolve(directory, file);
      const content = await readFile(path, { encoding: "utf8" });
      const json = JSON.parse(content) as CaseDefinition;

      return normalizeCase(json, path);
    }),
  );
}

function normalizeCase(definition: CaseDefinition, casePath: string): TestCase {
  return {
    name: definition.name,
    inputs: definition.inputs.map((input) => resolve(dirname(casePath), input)),
    expected: {
      schemaVersion: "2.1.0",
      modules: definition.modules,
    },
  };
}
