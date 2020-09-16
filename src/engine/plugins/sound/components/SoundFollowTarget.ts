import Vector3 from '@ecs/plugins/math/Vector';
import { Mesh } from 'three';

export interface SoundFollowOptions {
	coneInnerAngle?: number;
	coneOuterAngle?: number;
	coneOuterGain?: number;
	distanceModel: 'inverse' | 'linear';
	maxDistance: number;
	panningModel: 'HRTF' | 'equalpower';
	refDistance: number;
	rolloffFactor: number;
}

export default class SoundFollowTarget {
	constructor(
		public offset = Vector3.ZERO,
		public options: SoundFollowOptions = {
			coneInnerAngle: 360,
			coneOuterAngle: 360,
			coneOuterGain: 0,
			panningModel: 'HRTF',
			refDistance: 1,
			rolloffFactor: 1,
			distanceModel: 'inverse',
			maxDistance: 10000
		},
		public debug = false,
		public debugMesh: Mesh = null
	) {}
}
