# cem-generator-plugin-whitebox

[CEM Generator](https://github.com/wc-toolkit/cem-generator) plugin for [Whitebox](https://github.com/TomokiMiyauci/whitebox).

## Install

```bash
npx jsr add @whitebox/plugin-cem-generator
```

## Usage

Create a `cem-generator.config.mjs` file:

```js
import { whiteboxPlugins } from "@whitebox/plugin-cem-generator";

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

This plugin detects supported Whitebox decorators and extracts their metadata for the Custom Elements Manifest (CEM).

### `@customElement`

The `@customElement` decorator defines the custom element's tag name.

```ts
@customElement("my-element")
export class MyElement extends HTMLElement {}
```

The tag name is added to the class declaration's `tagName` field in the generated manifest.

The argument must be statically resolvable to a string literal type.

### `@style`

The `@style` decorator associates a CSS file with a custom element.

```ts
import styles from "./my-element.css" with { type: "css" };

@style(styles)
export class MyElement extends HTMLElement {}
```

The plugin resolves the imported CSS file and extracts CSS properties into the class declaration's `cssProperties` field in the generated manifest.

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
- CSS custom properties declared within `:host` rules are extracted only when accompanied by a CSS comment.

## License

[MIT](LICENSE)
