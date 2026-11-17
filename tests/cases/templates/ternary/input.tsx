import { template } from "@whitebox/react";

@template(() => true ? <slot name="primary" /> : <slot name="secondary" />)
class MyButton extends HTMLElement {}
