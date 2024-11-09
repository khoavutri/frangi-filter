import { func } from "./func1";

export class Test {
  data: any;
  constructor() {
    func();
    this.data = 1;
  }
  run() {
    console.log(this.data);
  }
}
