import ParticleEmitter from '@ecs/plugins/render/components/ParticleEmitter';

export function SparksTrail() {
	return new ParticleEmitter(['assets/hockey/sparkle.png'], {
		alpha: {
			list: [
				{
					value: 1,
					time: 0
				},
				{
					value: 0,
					time: 1
				}
			],
			isStepped: false
		},
		scale: {
			list: [
				{
					value: 0.1,
					time: 0
				},
				{
					value: 0.5,
					time: 1
				}
			],
			isStepped: false
		},
		minimumScaleMultiplier: 1,
		minimumSpeedMultiplier: 1,
		color: {
			list: [
				{
					value: '#FFFF00',
					time: 0
				},
				{
					value: '#FFFF00',
					time: 1
				}
			],
			isStepped: false
		},
		// speed: {
		//     list: [
		// 		{
		// 			value: 0,
		// 			time: 0
		// 		},
		// 		{
		// 			value: 0,
		// 			time: 1
		// 		}
		//     ],
		//     isStepped: false
		// },
		acceleration: {
			x: 0,
			y: 2
		},
		maxSpeed: 0,
		startRotation: {
			min: 1,
			max: 360
		},
		noRotation: false,
		rotationSpeed: {
			min: 180,
			max: 360
		},
		lifetime: {
			min: 1,
			max: 2
		},
		blendMode: 'add',
		frequency: 0.2,
		emitterLifetime: -1,
		maxParticles: 10,
		pos: {
			x: 0,
			y: 0
		},
		addAtBack: true,
		spawnType: 'rect',
		spawnRect: {
			x: 0,
			y: 0,
			w: 100,
			h: 100
		}
	});
}
