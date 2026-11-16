/**
 * Provides detector plugins for extracting Whitebox metadata during
 * CEM Generator's manifest generation process.
 *
 * The plugin consists of three detectors, each responsible for a
 * different kind of metadata:
 *
 * - **Custom elements**: Extracts statically resolvable tag names from
 *   `@customElement` decorators and adds them to class declarations.
 * - **Attributes**: Detects `@attr` decorated auto-accessors and adds
 *   their types and documentation metadata to the corresponding class
 *   attributes.
 * - **Styles**: Resolves stylesheets referenced by `@style` decorators,
 *   extracts CSS metadata, and adds the resulting CSS properties to
 *   class declarations.
 *
 * @example Basic `cem-generator.config.mjs`
 * ```js
 * import { whiteboxPlugins } from "@whitebox/cem-generator-plugin";
 *
 * export default {
 *   include: ["src/*.{ts,tsx}"],
 *   plugins: [...whiteboxPlugins()],
 * };
 * ```
 *
 * @module
 */

export { whiteboxPlugins } from "./plugin.ts";
