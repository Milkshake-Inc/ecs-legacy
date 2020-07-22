import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import { makeQuery } from '@ecs/ecs/Query';
import { Engine } from '@ecs/ecs/Engine';
import { ECSGraph } from '../spaces/ECSGraph';
import { Key } from '@ecs/plugins/input/Control';
import Keyboard from '@ecs/plugins/input/Keyboard';
import { useState } from '@ecs/ecs/helpers';
import Input from '@ecs/plugins/input/components/Input';

const DebugControls = {
	toggle: Keyboard.key(Key.BackwardTick)
};

export class DebugSystem extends IterativeSystem {
	protected keyboard: Keyboard;
	protected engine: Engine;
	protected ecsGraph: ECSGraph;

	private open: boolean;

	protected inputs = useState(this, new Input(DebugControls));

	constructor() {
		super(makeQuery());

		this.keyboard = new Keyboard();
	}

	public updateFixed(dt: number) {
		super.updateFixed(dt);

		if (this.inputs.state.toggle.once && !this.open) {
			this.ecsGraph.toggle(true);
			this.open = true;
		}

		this.ecsGraph.update(dt);
	}

	public onAddedToEngine(engine: Engine) {
		this.engine = engine;
		this.ecsGraph = new ECSGraph(engine, false);
		this.engine.onEntityAdded.connect(this.onEntityAdded.bind(this));
		this.engine.onEntityRemoved.connect(this.onEntityRemoved.bind(this));
	}

	protected onEntityAdded = (entity: Entity) => {
		this.ecsGraph.addEntityToGraph(entity);
	};

	protected onEntityRemoved = (entity: Entity) => {
		this.ecsGraph.removeEntityFromGraph(entity);
	};
}
