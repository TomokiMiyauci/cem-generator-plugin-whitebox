# cem-generator-plugin-whitebox

[CEM Generator](https://github.com/wc-toolkit/cem-generator) plugin for
[Whitebox](https://github.com/TomokiMiyauci/whitebox).

## Install

```bash
npx jsr add @whitebox/cem-generator-plugin
```

## Usage

Create a `cem-generator.config.mjs` file:

```js
import { whiteboxPlugins } from "@whitebox/cem-generator-plugin";

export default {
  include: ["src/**/*.{ts,tsx,js,jsx}"],
  plugins: [...whiteboxPlugins()],
};
```

Generate the Custom Elements Manifest:

```bash
npx @wc-toolkit/cem-generator-cli generate
```

## Supported Syntax

This plugin detects supported Whitebox decorators and extracts their metadata
for the Custom Elements Manifest (CEM).

### `@customElement`

The `@customElement` decorator defines the custom element's tag name.

```ts
import { customElement } from "@whitebox/core";

@customElement("my-element")
export class MyElement extends HTMLElement {}
```

The tag name is added to the class declaration's `tagName` field in the
generated manifest.

The argument must be statically resolvable to a string literal type.

### `@attr`

The `@attr` decorator exposes an auto-accessor as an HTML attribute.

```ts
import { attr } from "@whitebox/core";

export class MyButton extends HTMLElement {
  @attr
  accessor label: string | null = null;
}
```

The accessor name is used as the HTML attribute name. In this example, the
`label` attribute is exposed.

The plugin collects decorated accessors as entries in the class declaration's
`attributes` field in the generated manifest.

### `@style`

The `@style` decorator associates a CSS file with a custom element.

```ts
import { style } from "@whitebox/core";
import styles from "./my-element.css" with { type: "css" };

@style(styles)
export class MyElement extends HTMLElement {}
```

The plugin resolves the imported CSS file and extracts CSS properties into the
class declaration's `cssProperties` field in the generated manifest.

For example, consider the following CSS:

```css
@property --my-color {
  syntax: "<color>";
  inherits: true;
  initial-value: black;
}

:host {
  /** The background color of the element. */
  --background-color: white;

  --not-extract: none;
}
```

The extraction rules are:

- All `@property` rules are extracted, regardless of comments.
- CSS custom properties declared within `:host` rules are extracted only when
  accompanied by a CSS comment.

### @template

The `@template` decorator defines the template function used to render a custom
element.

```tsx
import { template } from "@whitebox/react";

@template(() => (
  <>
    <slot name="header" />
    <button part="control">Click me</button>
    <button part="icon label" />
  </>
))
export class MyElement extends HTMLElement {}
```

The plugin analyzes the `template` function's return expressions and detects
native `slot` elements and HTML elements with `part` attributes.

Detected slots are added to the class declaration's `slots` field, and detected
CSS parts are added to its `cssParts` field in the generated manifest.

The plugin currently supports inline functions only, including both
expression-bodied and block-bodied functions.

The plugin analyzes JSX elements directly present in the function's return
expressions. It does not resolve local variable references or expand custom JSX
components.

## License

[MIT](LICENSE)
