import DisplayObject from './DisplayObject';
import Color from '@ecs/math/Color';
import Vector2 from '@ecs/math/Vector2';

export default class BitmapText extends DisplayObject {
	public constructor(
		public text: string = '',
		public font: string = 'Arial',
		public size: number = 16,
		public tint: number = Color.Black,
		public align: string = 'center',
		public anchor: Vector2 = Vector2.HALF
	) {
		super();
	}
}
