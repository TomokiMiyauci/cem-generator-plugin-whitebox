import ts from "typescript";
import {
  type ClassFragment,
  type DetectorPlugin,
  type ManifestFragment,
  parseCssMetadata,
} from "@wc-toolkit/cem-generator";
import { resolve, dirname } from "node:path";

export function customElementPlugin(): DetectorPlugin {
  return {
    name: "whitebox/customElement",

    shouldAnalyze(sourceText): boolean {
      return /(?:customElement)\b/.test(sourceText);
    },

    onFile(context): ManifestFragment {
      const fragment: ManifestFragment = {};

      context.sourceFile.forEachChild(function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) {
          const className = node.name.text;
          const tagName = getCustomElementTagName(node, context.checker);
          const classFragment: ClassFragment = {
            name: className,
            module: context.filePath,
            tagName,
          };

          fragment[className] = classFragment;
        }

        node.forEachChild(visit);
      });

      return fragment;
    },
  };
}

export function stylePlugin(): DetectorPlugin {
  return {
    name: "whitebox/style",
    onFile(context) {
      const fragment: ManifestFragment = {};

      context.sourceFile.forEachChild(function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) {
          const className = node.name.text;
          const specifier = getStyleSpecifier(node, context.checker);

          if (typeof specifier === "string") {
            const dir = dirname(context.filePath);
            const resolved = resolve(dir, specifier);
            const content = ts.sys.readFile(resolved);

            if (typeof content === "string") {
              const metadata = parseCssMetadata(content);

              const classFragment: ClassFragment = {
                name: className,
                module: context.filePath,
                cssProperties: metadata,
              };

              fragment[className] = classFragment;
            }
          }
        }

        node.forEachChild(visit);
      });

      return fragment;
    },
  };
}

function getStyleSpecifier(
  node: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): string | undefined {
  const decorator = (ts.getDecorators(node) ?? []).find((item) => {
    const symbol = getDecoratorSymbol(item, checker);

    return (
      symbol?.declarations?.some((declaration) =>
        declaration
          .getSourceFile()
          .fileName.includes("/node_modules/@whitebox/core/"),
      ) ?? false
    );
  });

  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    return undefined;
  }

  const argument = decorator.expression.arguments[0];

  if (!argument || !ts.isIdentifier(argument)) {
    return undefined;
  }

  const symbol = checker.getSymbolAtLocation(argument);

  if (!symbol) return undefined;

  const declaration = symbol.declarations?.find(ts.isImportClause);

  if (!declaration) return undefined;

  const importDeclaration = declaration.parent;

  if (!ts.isImportDeclaration(importDeclaration)) {
    return undefined;
  }

  const moduleSpecifier = importDeclaration.moduleSpecifier;

  if (!ts.isStringLiteral(moduleSpecifier)) {
    return undefined;
  }

  return moduleSpecifier.text;
}

function getCustomElementTagName(
  node: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): string | undefined {
  const decorator = (ts.getDecorators?.(node) ?? []).find((item) =>
    isWhiteboxCustomElement(item, checker),
  );

  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    return undefined;
  }

  const argument = decorator.expression.arguments[0];

  return argument ? resolveStringValue(argument, checker) : undefined;
}

function isWhiteboxCustomElement(
  decorator: ts.Decorator,
  checker: ts.TypeChecker,
): boolean {
  const symbol = getDecoratorSymbol(decorator, checker);

  if (!symbol) return false;

  return (
    symbol.declarations?.some((declaration) => {
      const sourceFile = declaration.getSourceFile();
      return sourceFile.fileName.includes("/node_modules/@whitebox/core/");
    }) ?? false
  );
}

function getDecoratorSymbol(
  decorator: ts.Decorator,
  checker: ts.TypeChecker,
): ts.Symbol | undefined {
  const expression = decorator.expression;
  const target = ts.isCallExpression(expression)
    ? expression.expression
    : expression;

  const symbol = checker.getSymbolAtLocation(target);
  if (!symbol) return undefined;

  return symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

export function resolveStringValue(
  node: ts.Node,
  checker: ts.TypeChecker,
): string | undefined {
  const type = checker.getTypeAtLocation(node);

  if (type.isStringLiteral()) {
    return type.value;
  }

  return undefined;
}
