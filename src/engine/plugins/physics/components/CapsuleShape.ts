export default class CapsuleShape {
	constructor(public height: number, public radius: number, public axis: 'x' | 'y' | 'z' = 'y', public offsetRadius = true) {}
}
