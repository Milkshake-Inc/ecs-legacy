import { useSimpleEvents, useState } from '@ecs/ecs/helpers';
import { useEntity } from '@ecs/ecs/helpers/useEntity';
import { System } from '@ecs/ecs/System';
import Color from '@ecs/math/Color';
import Vector3 from '@ecs/math/Vector';
import Text from '@ecs/plugins/render/components/Text';
import Transform from '@ecs/plugins/Transform';
import WebFont from 'webfontloader';

export const CREATE_CHAT_MSG = 'CREATE_CHAT_MSG';

class ChatBoxState {
	messages: { value: string; color: number }[];

	constructor() {
		this.messages = [];
	}
}

export default class ClientChatBoxSystem extends System {
	protected events = useSimpleEvents();

	protected entity = useEntity(this, entity => {
		entity.add(Transform, { x: 10, y: 720 - 10 });
		entity.add(Text, {
			align: 'left',
			tint: Color.White,
			font: 'Quicksand',
			anchor: Vector3.UP,
			size: 20
		});
	});

	protected state = useState(this, new ChatBoxState());

	constructor() {
		super();

		WebFont.load({
			google: {
				families: ['Quicksand:700','Quicksand:400']
			}
		});

		this.events.on(CREATE_CHAT_MSG, value => this.createChatMessage(value));
	}

	private createChatMessage(value: string) {
		if (this.state.messages.length > 5) {
			this.state.messages.pop();
		}

		this.state.messages.push({
			value,
			color: Color.White
		});

		this.entity.get(Text).value = this.state.messages.map(a => a.value).join('\n');
	}
}
