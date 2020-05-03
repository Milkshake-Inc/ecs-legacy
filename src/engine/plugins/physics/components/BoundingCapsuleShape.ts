export default class BoundingCapsuleShape {
	constructor(public axis: 'x' | 'y' | 'z' = 'y', public offsetRadius = true) {}
}
