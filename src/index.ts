import { Test } from "./models/test";

const canvas = document.getElementById("canvas");
if (canvas) {
  canvas.style.background = "blue";
}

canvas.addEventListener("click", () => {
  canvas.style.background = "red";
});
