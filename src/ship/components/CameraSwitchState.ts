export enum CameraSwitchType {
	Ship,
	Player,
	Freeroam
}

export default class CameraSwitchState {
	constructor(public state = CameraSwitchType.Ship) {}
}
