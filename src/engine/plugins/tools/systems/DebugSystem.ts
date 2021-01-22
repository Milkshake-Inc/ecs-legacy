import { Entity, System, Engine } from 'tick-knock';
import { ECSGraph } from '../spaces/ECSGraph';
import { Key } from '@ecs/plugins/input/Control';
import Keyboard from '@ecs/plugins/input/Keyboard';
import { useState } from '@ecs/core/helpers';
import Input from '@ecs/plugins/input/components/Input';

const DebugControls = {
	toggle: Keyboard.key(Key.BackwardTick)
};

export class DebugSystem extends System {
	protected keyboard = new Keyboard();
	protected ecsGraph: ECSGraph;

	private open: boolean;

	protected inputs = useState(this, new Input(DebugControls));

	public updateFixed(dt: number) {
		super.updateFixed(dt);

		if (this.inputs.state.toggle.once && !this.open) {
			this.ecsGraph.toggle(true);
			this.open = true;
		}

		this.ecsGraph.update(dt);
	}

	public onAddedToEngine(engine: Engine) {
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
