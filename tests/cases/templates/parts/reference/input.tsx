import { template } from "@whitebox/react";

const part = "test";

@template(() => <div part={part} />)
class MyButton extends HTMLElement {}
