import { template } from "@whitebox/react";

function Slot() {
  return <slot></slot>;
}

@template(() => <Slot />)
class MyButton extends HTMLElement {}
