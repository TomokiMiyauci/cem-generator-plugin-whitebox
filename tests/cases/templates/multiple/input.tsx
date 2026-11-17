import { template } from "@whitebox/react";

@template(() => (
  <>
    <slot></slot>
    <slot name="test" />
  </>
))
class MyButton extends HTMLElement {}
