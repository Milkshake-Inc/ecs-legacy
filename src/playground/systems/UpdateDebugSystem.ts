import { System } from '@ecs/ecs/System';
import { Engine } from '@ecs/ecs/Engine';
import BitmapText from '@ecs/plugins/render/components/BitmapText';
import { Entity } from '@ecs/ecs/Entity';
import Position from '@ecs/plugins/Position';
import Color from '@ecs/math/Color';
import Vector2 from '@ecs/math/Vector2';

export class UpdateDebugSystem extends System {
	protected textEntity: Entity;
	protected bitmapText: BitmapText;

	private startTime = -1;

	private updateCalls = 0;
	private updateFixedCalls = 0;

	constructor() {
		super();

		this.textEntity = new Entity();
		this.textEntity.add(Position, Vector2.EQUAL(10));
		this.textEntity.add(BitmapText, {
			text: 'HI',
			tint: Color.Red
		});

		this.bitmapText = this.textEntity.get(BitmapText);
	}

	onAddedToEngine = (engine: Engine) => {
		engine.addEntity(this.textEntity);
	};

	public updateFixed(dt: number) {
		this.updateFixedCalls++;
	}

	private resetClock() {
		this.startTime = Date.now();
		this.updateCalls = 0;
		this.updateFixedCalls = 0;
	}

	public update(dt: number) {
		this.updateCalls++;

		if (this.startTime == -1) {
			this.resetClock();
		} else {
			if (Date.now() - this.startTime >= 1000) {
				this.bitmapText.text = `Update: ${this.updateCalls}\n Fixed: ${this.updateFixedCalls}`;
				this.resetClock();
			}
		}
	}
}
