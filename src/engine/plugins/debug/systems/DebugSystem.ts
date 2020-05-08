import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Keyboard from '@ecs/input/Keyboard';
import { Entity } from '@ecs/ecs/Entity';
import Key from '@ecs/input/Key';
import { makeQuery } from '@ecs/utils/QueryHelper';
import { Engine } from '@ecs/ecs/Engine';
import { ECSGraph } from '../spaces/ECSGraph';

export class DebugSystem extends IterativeSystem {
	protected keyboard: Keyboard;
	protected engine: Engine;
	protected ecsGraph: ECSGraph;

	private open: boolean;

	constructor() {
		super(makeQuery());

		this.keyboard = new Keyboard();
	}

	public updateFixed(dt: number, frameDt: number) {
		super.updateFixed(dt, frameDt);

		if (this.keyboard.isEitherDown([Key.BACKWARD_TICK]) && !this.open) {
			this.ecsGraph.toggle(true);
			this.open = true;
		}

		this.ecsGraph.update(dt);
		this.keyboard.update();
	}

	public onAddedToEngine(engine: Engine) {
		this.engine = engine;
		this.ecsGraph = new ECSGraph(engine, 'ecs graph');
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
