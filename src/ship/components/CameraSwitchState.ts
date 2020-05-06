export enum CameraSwitchType {
	Ship,
	Helicopter,
	Player,
	Freeroam
}

export default class CameraSwitchState {
	constructor(public state = CameraSwitchType.Ship) {}
}
