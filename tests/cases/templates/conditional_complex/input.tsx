import { template } from "@whitebox/react";

@template(() => {
  if (true) {
    return <slot name="primary" />;
  }

  return <slot name="secondary" />;
})
class MyButton extends HTMLElement {}
