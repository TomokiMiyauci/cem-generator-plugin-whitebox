import { customElement, style } from "@whitebox/core";
import css from "./style.css" with { type: "css" };

@customElement("my-button")
@style(css)
class MyButton extends HTMLElement {}
