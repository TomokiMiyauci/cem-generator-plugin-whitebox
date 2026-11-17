import { template } from "@whitebox/react";

@template(() => (
  <>
    {true && <slot />}
    {false && <slot name="test" />}
  </>
))
class MyButton extends HTMLElement {}
