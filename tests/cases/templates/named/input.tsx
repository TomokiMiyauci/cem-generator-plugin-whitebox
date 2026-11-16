import { template } from "@whitebox/react";

@template(() => <slot name="test" />)
class MyButton extends HTMLElement {}
