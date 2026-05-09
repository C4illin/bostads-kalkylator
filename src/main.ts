import { calculator } from "./calculator.ts";
import template from "./template.html?raw";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = template;
calculator();
