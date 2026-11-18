import ts from "typescript";
import {
  type ClassFragment,
  detectClassMembers,
  type DetectorPlugin,
  type FileContext,
  type ManifestFragment,
  parseCssMetadata,
} from "@wc-toolkit/cem-generator";
import { getNodeTypeText } from "@wc-toolkit/cem-generator-utils";
import { dirname, resolve } from "node:path";

/**
 * Returns the Whitebox detector plugins for CEM generator.
 */
export function whiteboxPlugins(): DetectorPlugin[] {
  return [
    customElementPlugin(),
    stylePlugin(),
    attrPlugin(),
    jsxSlotPlugin(),
    jsxPartPlugin(),
  ];
}

export function customElementPlugin(): DetectorPlugin {
  return {
    name: "whitebox/customElement",

    shouldAnalyze(sourceText): boolean {
      return /customElement\b/.test(sourceText);
    },

    onFile(context): ManifestFragment {
      const fragment: ManifestFragment = {};

      context.sourceFile.forEachChild(function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) {
          const className = node.name.text;
          const tagName = getCustomElementTagName(node, context.checker) ??
            undefined;
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
    shouldAnalyze(sourceFile) {
      return /style\b/.test(sourceFile);
    },
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
      return /attr\b/.test(sourceFile);
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

export function jsxSlotPlugin(): DetectorPlugin {
  return {
    name: "whitebox/jsx@slot",

    shouldAnalyze(sourceFile) {
      return /template\b/.test(sourceFile);
    },

    onFile(context) {
      const fragment: ManifestFragment = {};

      context.sourceFile.forEachChild(function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) {
          const className = node.name.text;
          const slots = getSlots(node, context.checker) ?? undefined;

          const classFragment: ClassFragment = { name: className, slots };

          fragment[className] = classFragment;
        }

        node.forEachChild(visit);
      });

      return fragment;
    },
  };
}

export function jsxPartPlugin(): DetectorPlugin {
  return {
    name: "whitebox/jsx@part",

    shouldAnalyze(sourceFile) {
      return /template\b/.test(sourceFile);
    },

    onFile(context) {
      const fragment: ManifestFragment = {};

      context.sourceFile.forEachChild(function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) {
          const className = node.name.text;
          const cssParts = getParts(node, context.checker) ?? undefined;

          const classFragment: ClassFragment = { name: className, cssParts };

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
  const decorator = (ts.getDecorators(node) ?? []).find((item) =>
    isWhiteboxDecorator(item, "customElement", checker)
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
  return getDecoratorSymbol(decorator, checker)?.name === name;
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
      isWhiteboxDecorator(decorator, "attr", context.checker)
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

function getSlots(
  node: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): ClassFragment["slots"] | null {
  const decorators = ts.getDecorators(node) ?? [];
  const decorator = decorators.find((item) =>
    isWhiteboxDecorator(item, "template", checker)
  );

  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    return null;
  }

  const template = decorator.expression.arguments[0];

  if (!template) return null;

  const slots: NonNullable<ClassFragment["slots"]> = [];
  const names = new Set<string>();

  function visit(node: ts.Node): void {
    if (ts.isJsxElement(node)) {
      addSlot(node.openingElement);
    } else if (ts.isJsxSelfClosingElement(node)) {
      addSlot(node);
    }

    node.forEachChild(visit);
  }

  function addSlot(
    node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  ): void {
    if (!ts.isIdentifier(node.tagName) || node.tagName.text !== "slot") {
      return;
    }

    const nameAttribute = node.attributes.properties.find(
      (property): property is ts.JsxAttribute =>
        ts.isJsxAttribute(property) && property.name.getText() === "name",
    );

    const name = nameAttribute
      ? getAttributeValue(nameAttribute, checker) ?? ""
      : "";

    if (names.has(name)) return;

    names.add(name);
    slots.push({ name });
  }

  for (const expression of getTemplateExpressions(template)) {
    visit(expression);
  }

  return slots.length > 0 ? slots : null;
}

function getAttributeValue(
  attr: ts.JsxAttribute,
  checker: ts.TypeChecker,
): string | null {
  const initializer = attr.initializer;

  if (!initializer) return null;

  if (ts.isStringLiteral(initializer)) {
    return initializer.text;
  } else if (
    ts.isJsxExpression(initializer) &&
    initializer.expression
  ) {
    const value = resolveStringValue(initializer.expression, checker);

    return value;
  }

  return null;
}

function getTemplateExpressions(
  template: ts.Expression,
): ts.Node[] {
  const body = ts.isFunctionLike(template) ? template.body : undefined;

  if (!body) return [];

  return getReturnExpressions(body);
}

function getReturnExpressions(
  body: ts.ConciseBody,
): ts.Expression[] {
  if (!ts.isBlock(body)) {
    return [body];
  }

  const expressions: ts.Expression[] = [];

  function visit(node: ts.Node): void {
    if (node !== body && ts.isFunctionLike(node)) {
      return;
    }

    if (ts.isReturnStatement(node) && node.expression) {
      expressions.push(node.expression);
      return;
    }

    node.forEachChild(visit);
  }

  visit(body);
  return expressions;
}

function getParts(
  node: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): ClassFragment["cssParts"] | null {
  const decorators = ts.getDecorators(node) ?? [];
  const decorator = decorators.find((item) =>
    isWhiteboxDecorator(item, "template", checker)
  );

  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    return null;
  }

  const template = decorator.expression.arguments[0];
  if (!template) return null;

  const parts: NonNullable<ClassFragment["cssParts"]> = [];
  const names = new Set<string>();

  function visit(node: ts.Node): void {
    if (ts.isJsxElement(node)) {
      addParts(node.openingElement);
    } else if (ts.isJsxSelfClosingElement(node)) {
      addParts(node);
    }

    node.forEachChild(visit);
  }

  function addParts(
    node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  ): void {
    if (!isHtmlElement(node)) return;

    const attribute = node.attributes.properties.find(
      (property): property is ts.JsxAttribute =>
        ts.isJsxAttribute(property) && property.name.getText() === "part",
    );

    if (!attribute) return;

    const value = getAttributeValue(attribute, checker);
    if (value === null) return;

    for (const name of value.split(/\s+/).filter(Boolean)) {
      if (names.has(name)) continue;

      names.add(name);
      parts.push({ name });
    }
  }

  for (const expression of getTemplateExpressions(template)) {
    visit(expression);
  }

  return parts.length > 0 ? parts : null;
}

function isHtmlElement(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
): boolean {
  return (
    ts.isIdentifier(node.tagName) &&
    /^[a-z]/.test(node.tagName.text) &&
    !node.tagName.text.includes("-")
  );
}
