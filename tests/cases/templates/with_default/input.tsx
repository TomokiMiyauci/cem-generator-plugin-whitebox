import { template } from "@whitebox/react";

@template(() => <slot>default</slot>)
class MyButton extends HTMLElement {}
