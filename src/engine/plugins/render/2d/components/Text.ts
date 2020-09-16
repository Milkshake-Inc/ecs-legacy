import Color from '@ecs/plugins/math/Color';
import Vector3 from '@ecs/plugins/math/Vector';

export default class Text {
	public constructor(
		public value: string = '',
		public font: string = 'Arial',
		public size: number = 16,
		public tint: number = Color.Black,
		public align: string = 'center',
		public anchor: Vector3 = Vector3.HALF
	) {}
}
