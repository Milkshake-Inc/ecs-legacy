import Input from "./Input";

export class InputHistory {
	constructor(public inputs: { [tick: number]: Input } = {}) {}
}
