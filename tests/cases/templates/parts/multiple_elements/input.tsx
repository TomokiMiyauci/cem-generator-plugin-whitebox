import { template } from "@whitebox/react";

@template(() => (
  <>
    <div part="test" />
    <div part="test2" />
  </>
))
class MyButton extends HTMLElement {}
