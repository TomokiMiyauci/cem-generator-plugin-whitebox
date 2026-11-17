import { template } from "@whitebox/react";

function render() {
  return <slot></slot>;
}

@template(render)
class MyButton extends HTMLElement {}
