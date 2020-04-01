import { Rectangle } from 'pixi.js';
import DisplayObject from './DisplayObject';
import Vector2 from '@ecs/math/Vector2';

export default class Sprite extends DisplayObject {
	public constructor(
		public imageUrl: string = '',
		public anchor: Vector2 = Vector2.HALF,
		public frame: Rectangle = null,
		public tint: number = 0xffffff
	) {
		super();
	}
}
