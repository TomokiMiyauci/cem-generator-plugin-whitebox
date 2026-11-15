import ts from "typescript";
import {
  type ClassFragment,
  type DetectorPlugin,
  type ManifestFragment,
  parseCssMetadata,
  type FileContext,
  detectClassMembers,
} from "@wc-toolkit/cem-generator";
import { getNodeTypeText } from "@wc-toolkit/cem-generator-utils";
import { resolve, dirname } from "node:path";

export function whiteboxPlugins(): DetectorPlugin[] {
  return [customElementPlugin(), stylePlugin(), attrPlugin()];
}

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
          const tagName =
            getCustomElementTagName(node, context.checker) ?? undefined;
          const classFragment: ClassFragment = { name: className, tagName };

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

export function attrPlugin(): DetectorPlugin {
  return {
    name: "whitebox/attr",
    shouldAnalyze: (sourceFile) => {
      return /(?:attr)\b/.test(sourceFile);
    },
    onFile(context) {
      const fragment: ManifestFragment = {};

      context.sourceFile.forEachChild(function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) {
          const className = node.name.text;
          const attributes = getAttributes(node, context) ?? undefined;

          const classFragment: ClassFragment = { name: className, attributes };

          fragment[className] = classFragment;
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
): string | null {
  const decorator = (ts.getDecorators(node) ?? []).find((item) => {
    return isWhiteboxDecorator(item, "style", checker);
  });

  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    return null;
  }

  const argument = decorator.expression.arguments[0];

  if (!argument || !ts.isIdentifier(argument)) {
    return null;
  }

  const symbol = checker.getSymbolAtLocation(argument);

  if (!symbol) return null;

  const declaration = symbol.declarations?.find(ts.isImportClause);

  if (!declaration) return null;

  const importDeclaration = declaration.parent;

  if (!ts.isImportDeclaration(importDeclaration)) {
    return null;
  }

  const moduleSpecifier = importDeclaration.moduleSpecifier;

  if (!ts.isStringLiteral(moduleSpecifier)) {
    return null;
  }

  return moduleSpecifier.text;
}

function getCustomElementTagName(
  node: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): string | null {
  const decorator = (ts.getDecorators?.(node) ?? []).find((item) =>
    isWhiteboxDecorator(item, "customElement", checker),
  );

  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    return null;
  }

  const argument = decorator.expression.arguments[0];

  return argument ? resolveStringValue(argument, checker) : null;
}

function isWhiteboxDecorator(
  decorator: ts.Decorator,
  name: string,
  checker: ts.TypeChecker,
): boolean {
  const symbol = getDecoratorSymbol(decorator, checker);

  return (
    symbol?.name === name &&
    (symbol.declarations?.some((declaration) =>
      declaration
        .getSourceFile()
        .fileName.includes("/node_modules/@whitebox/core/"),
    ) ??
      false)
  );
}
function getDecoratorSymbol(
  decorator: ts.Decorator,
  checker: ts.TypeChecker,
): ts.Symbol | null {
  const expression = decorator.expression;
  const target = ts.isCallExpression(expression)
    ? expression.expression
    : expression;
  const symbol = checker.getSymbolAtLocation(target);

  if (!symbol) return null;

  return symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

export function resolveStringValue(
  node: ts.Node,
  checker: ts.TypeChecker,
): string | null {
  const type = checker.getTypeAtLocation(node);

  if (type.isStringLiteral()) {
    return type.value;
  }

  return null;
}

function getAttributes(
  node: ts.ClassDeclaration,
  context: FileContext,
): ClassFragment["attributes"] | null {
  const members = detectClassMembers(node, context);
  const byName = new Map(
    (members ?? []).map((member) => [member.name, member]),
  );

  const attributes = node.members.reduce<
    NonNullable<ClassFragment["attributes"]>
  >((result, member) => {
    if (!ts.isPropertyDeclaration(member)) return result;

    const modifiers = ts.getModifiers(member);
    if (
      !modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.AccessorKeyword,
      )
    ) {
      return result;
    }

    const decorator = (ts.getDecorators(member) ?? []).find((decorator) =>
      isWhiteboxDecorator(decorator, "attr", context.checker),
    );
    if (!decorator) return result;

    const name = member.name.getText();
    const field = byName.get(name);

    if (!field || field.internal) return result;

    return [
      ...result,
      {
        name,
        type: getNodeTypeText(member, context.checker),
        description: field.description,
        summary: field.summary,
        deprecated: field.deprecated,
        default: field.default,
        fieldName: name,
      },
    ];
  }, []);

  return attributes.length > 0 ? attributes : null;
}
