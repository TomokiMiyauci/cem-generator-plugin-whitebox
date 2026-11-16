import { style } from "@whitebox/core";
import css from "./style.css" with { type: "css" };

@style(css)
class MyButton extends HTMLElement {}
