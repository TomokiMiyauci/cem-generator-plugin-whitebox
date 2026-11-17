import { template } from "@whitebox/react";

@template(() => {
  const slot = <slot></slot>;

  return slot;
})
class MyButton extends HTMLElement {}
