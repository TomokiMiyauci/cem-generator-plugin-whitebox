import ts from "typescript";
import {
  type ClassFragment,
  type DetectorPlugin,
  type ManifestFragment,
} from "@wc-toolkit/cem-generator";

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
