import { template } from "@whitebox/react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "my-button": { part: string };
    }
  }
}

@template(() => <my-button part="test"></my-button>)
class MyButton extends HTMLElement {}
