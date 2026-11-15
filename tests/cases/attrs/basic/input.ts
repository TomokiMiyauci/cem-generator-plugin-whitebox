import { attr } from "@whitebox/core";

export class MyButton extends HTMLElement {
  @attr
  accessor count: string | null = null;
}
