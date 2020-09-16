import { Engine } from '@ecs/core/Engine';
import { Entity } from '@ecs/core/Entity';
import SpaceTag from './components/SpaceTag';
import { System } from '@ecs/core/System';
import { Query } from '@ecs/core/Query';

export default class Space {
	public readonly name: string;

	protected worldEngine: Engine;
	private loaded = false;
	private visible = false;

	private entities: Entity[];
	private systems: { system: System; priority: number }[];
	private queries: Query[];

	constructor(engine: Engine, open = false) {
		this.worldEngine = engine;

		this.entities = [];
		this.systems = [];
		this.queries = [];

		if (open) {
			this.open();
		}
	}

	public addEntities(...entities: Entity[]) {
		entities.forEach(entity => this.addEntity(entity));
	}

	public addEntity(entity: Entity) {
		entity.add(SpaceTag, { spaceName: this.name });
		this.entities.push(entity);

		if (this.visible) {
			this.worldEngine.addEntity(entity);
		}
	}

	public removeEntities(...entities: Entity[]) {
		entities.forEach(entity => this.removeEntity(entity));
	}

	public removeEntity(entity: Entity) {
		this.entities = this.entities.filter(e => e != entity);

		if (this.visible) {
			this.worldEngine.removeEntity(entity);
		}
	}

	public addSystem(system: System, priority = 0) {
		this.systems.push({ system, priority });

		if (this.visible) {
			this.worldEngine.addSystem(system, priority);
		}
	}

	public removeSystem(system: System) {
		this.systems = this.systems.filter(s => s.system != system);

		if (this.visible) {
			this.worldEngine.removeSystem(system);
		}
	}

	public async toggle(reset = false) {
		if (this.visible) {
			return this.close(reset);
		}
		await this.open(reset);
	}

	public async open(reset = false) {
		console.log(`🚀opening space ${this.constructor.name}`);
		if (reset && this.loaded) {
			this.clear();
		}

		if (!this.loaded) {
			await this.preload();
			this.setup();
			this.loaded = true;
		}

		this.show();
	}

	public close(destroy = false) {
		console.log(`🚀closing space ${this.constructor.name}`);
		this.hide();
		if (destroy) {
			this.clear();
		}
	}

	public clear() {
		this.loaded = false;
	}

	protected async preload(): Promise<any> {}

	protected setup() {}

	private show() {
		if (this.visible) return;
		this.queries.forEach(q => this.worldEngine.addQuery(q));
		this.systems.forEach(({ system, priority }) => this.worldEngine.addSystem(system, priority));
		this.entities.forEach(e => this.worldEngine.addEntity(e));

		this.visible = true;
	}

	private hide() {
		if (!this.visible) return;
		this.entities.forEach(e => this.worldEngine.removeEntity(e));
		this.systems.forEach(({ system }) => this.worldEngine.removeSystem(system));
		this.queries.forEach(q => this.worldEngine.removeQuery(q));
		this.visible = false;
	}
}
