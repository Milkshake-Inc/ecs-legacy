import Color from '@ecs/math/Color';
import Vector2 from '@ecs/math/Vector2';

export default class Text {
	public constructor(
		public value: string = '',
		public font: string = 'Arial',
		public size: number = 16,
		public tint: number = Color.Black,
		public align: string = 'center',
		public anchor: Vector2 = Vector2.HALF
	) {}
}
