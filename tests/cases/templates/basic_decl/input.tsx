import { template } from "@whitebox/react";

@template(function () {
  return <slot></slot>;
})
class MyButton extends HTMLElement {}
