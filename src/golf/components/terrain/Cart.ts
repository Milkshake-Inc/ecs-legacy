import Vector3 from '@ecs/math/Vector';

export default class Cart {
	elapsed = 0;
	startRotation: number;
	targetRotation: number;
	previousTrackIndex: number;
	trackIndex: number;
}
