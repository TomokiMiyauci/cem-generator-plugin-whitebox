import { template } from "@whitebox/react";

@template(() => (
  <>
    <slot></slot>
    <slot name="test" />
    <slot></slot>
  </>
))
class MyButton extends HTMLElement {}
