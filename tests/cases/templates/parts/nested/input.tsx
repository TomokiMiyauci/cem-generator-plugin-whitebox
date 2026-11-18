import { template } from "@whitebox/react";

@template(() => (
  <div part="container">
    <button part="control" />
    <span part="label" />
  </div>
))
class MyButton extends HTMLElement {}
