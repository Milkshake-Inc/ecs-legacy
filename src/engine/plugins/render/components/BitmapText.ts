import DisplayObject from './DisplayObject';
import Color from '@ecs/math/Color';

export default class BitmapText extends DisplayObject {
	public constructor(
		public text: string = '',
		public font: string = 'Arial',
		public size: number = 16,
		public tint: number = Color.Black
	) {
		super();
	}
}
