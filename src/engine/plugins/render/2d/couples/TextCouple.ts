import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/math/Transform';
import { all } from '@ecs/ecs/Query';
import { Text as PixiText, TextStyle } from 'pixi.js';
import Text from '../components/Text';
import { usePixiCouple } from './PixiCouple';

export const useTextCouple = (system: System) =>
	usePixiCouple<PixiText>(system, all(Transform, Text), {
		onCreate: entity => {
			const text = entity.get(Text);

			const textStyle = new TextStyle({
				fontFamily: text.font,
				fontSize: text.size,
				fill: text.tint,
				align: text.align
			});

			return new PixiText(text.value, textStyle);
		},
		onUpdate: (entity, displayObject) => {
			const sprite = entity.get(Text);

			displayObject.text = sprite.value;
			displayObject.tint = sprite.tint;

			const displayObjectStyle: TextStyle = displayObject.style;
			displayObjectStyle.align = sprite.align;

			// I think this is an issue in the typedefs
			(displayObject.anchor as any).x = sprite.anchor.x;
			(displayObject.anchor as any).y = sprite.anchor.y;
		}
	});
