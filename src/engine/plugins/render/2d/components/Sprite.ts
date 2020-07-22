import { Rectangle } from 'pixi.js';
import Vector3 from '@ecs/plugins/math/Vector';

export default class Sprite {
	public constructor(
		public imageUrl: string = '',
		public anchor: Vector3 = Vector3.HALF,
		public frame: Rectangle = null,
		public tint: number = 0xffffff
	) {}
}
