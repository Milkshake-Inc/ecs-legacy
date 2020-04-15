import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Keyboard from '@ecs/input/Keyboard';
import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import Key from '@ecs/input/Key';
import { makeQuery } from '@ecs/utils/QueryHelper';
import { Engine } from '@ecs/ecs/Engine';
import { ECSGraph } from '../spaces/ECSGraph';

export class DebugSystem extends IterativeSystem {
	protected keyboard: Keyboard;
	protected engine: Engine;
	protected ecsGraph: ECSGraph;

	constructor() {
		super(makeQuery());

		this.keyboard = new Keyboard();
	}

	public updateFixed(dt: number) {
		super.updateFixed(dt);
		if (this.keyboard.isDownOnce(Key.BACKWARD_TICK)) {
			this.ecsGraph.toggle(true);
		}

		this.ecsGraph.update(dt);
		this.keyboard.update(dt);
	}

	public onAddedToEngine(engine: Engine) {
		this.engine = engine;
		this.ecsGraph = new ECSGraph(engine, 'ecs graph');
		this.engine.onEntityAdded.connect(this.onEntityAdded.bind(this));
		this.engine.onEntityRemoved.connect(this.onEntityRemoved.bind(this));
	}

	protected onEntityAdded = (entity: EntitySnapshot) => {
		this.ecsGraph.addEntityToGraph(entity.entity);
	};

	protected onEntityRemoved = (entity: Entity) => {
		this.ecsGraph.removeEntityFromGraph(entity);
	};
}
