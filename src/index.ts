import { Test } from "./models/test";
import { Test2 } from "./models/test2";

const KhoaTools = {
  test1: Test,
  test2: Test2,
};

console.log("The product is owned by Vu Tri Khoa");

if (typeof module !== "undefined" && module.exports) {
  module.exports = { KhoaTools };
} else if (typeof define === "function" && define.amd) {
  define([], function () {
    return { KhoaTools };
  });
} else {
  (window as any).KhoaTools = KhoaTools;
}
