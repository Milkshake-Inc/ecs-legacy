import Vector3 from '@ecs/math/Vector';

export default class Cart {
	elapsed = 0;
	previousTrackIndex: number;
	trackIndex: number;
	nextTrackIndex: number;
	previousPosition: Vector3 = new Vector3();
}
