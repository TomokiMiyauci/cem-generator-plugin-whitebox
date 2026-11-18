import { template } from "@whitebox/react";

function getPart(): string {
  return "test";
}

@template(() => <div part={getPart()} />)
class MyButton extends HTMLElement {}
