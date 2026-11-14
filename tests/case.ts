// case.ts
import { resolve, dirname } from "node:path";
import { Package } from "custom-elements-manifest";

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
  const glob = new Bun.Glob("**/*.json");
  const files: string[] = [];

  for await (const file of glob.scan({ cwd: directory })) {
    files.push(file);
  }

  files.sort();

  return Promise.all(
    files.map(async (file) => {
      const path = resolve(directory, file);
      const definition = (await Bun.file(path).json()) as CaseDefinition;

      return normalizeCase(definition, path);
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
