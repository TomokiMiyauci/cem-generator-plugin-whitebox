import { template } from "@whitebox/react";

@template(() => (
  <>
    <button part="control label" />
    <span part="label" />
  </>
))
class MyButton extends HTMLElement {}
