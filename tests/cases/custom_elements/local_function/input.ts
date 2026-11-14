function customElement(name: string) {
  return (target: CustomElementConstructor) => {};
}

@customElement("my-button")
class MyButton extends HTMLElement {}
