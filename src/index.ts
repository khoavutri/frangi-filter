import { Test } from "./models/test";

const canvas = document.getElementById("canvas");
if (canvas) {
  canvas.style.background = "blue";
}

canvas.addEventListener("click", () => {
  if (canvas.style.backgroundColor === "red")
    canvas.style.backgroundColor = "blue";
  else canvas.style.backgroundColor = "red";
});
console.log("khopa");
