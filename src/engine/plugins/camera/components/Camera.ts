import Vector2 from '@ecs/math/Vector2';
import { Transform } from 'pixi.js';

export type FollowOptions = {
	bounded?: boolean;
	padding?: number;
	minZoom?: number;
	maxZoom?: number;
};

export default class Camera {
	constructor(
		public x = 0,
		public y = 0,
		public width = 1280,
		public height = 720,
		public zoom = 1,
		public offset = new Vector2(width / 2, height / 2),
		public scrollOptions: FollowOptions = { bounded: false, padding: 0, minZoom: 1, maxZoom: 0.01 },
		public transform = new Transform()
	) {}
}
