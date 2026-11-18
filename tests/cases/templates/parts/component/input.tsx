import { template } from "@whitebox/react";

function Button(props: { part: string }) {
  return null;
}

@template(() => <Button part="test"></Button>)
class MyButton extends HTMLElement {}
