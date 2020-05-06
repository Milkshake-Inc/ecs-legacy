export enum CameraSwitchType {
	Boat,
	Helicopter,
	Player,
	Freeroam
}

export default class CameraSwitchState {
	constructor(public state = CameraSwitchType.Boat) {}
}
