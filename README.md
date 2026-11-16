# cem-generator-plugin-whitebox

[CEM generator](https://github.com/wc-toolkit/cem-generator) for [Whitebox](https://github.com/TomokiMiyauci/whitebox).

## Install

```bash
npx jsr add @whitebox/plugin-cem-generator
```

## Usage

cem-generator.config.mjs:

```ts
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

## License

[MIT](LICENSE)
