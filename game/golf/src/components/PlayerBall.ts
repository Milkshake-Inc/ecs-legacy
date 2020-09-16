import Vector3 from '@ecs/plugins/math/Vector';

export default class PlayerBall {
	public timeWhenPutt = -1;
	public isBallResetting = false;
	public lastPosition = new Vector3();
	public moving = false;
}
