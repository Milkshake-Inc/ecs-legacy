import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import SpaceTag from './components/SpaceTag';

export default class Space extends Engine {
	public readonly name: string;

	protected worldEngine: Engine;
	private loaded = false;
	private visible = false;

	constructor(engine: Engine, name: string) {
		super();

		this.name = name;
		this.worldEngine = engine;
	}

	public addEntity(entity: Entity) {
		entity.add(SpaceTag, { spaceName: this.name });
		return super.addEntity(entity);
	}

	public async open(reset = false) {
		console.log(`🚀opening space ${this.name}`);
		if (reset || !this.loaded) {
			this.clear();
			await this.preload();
			this.setup();
			this.loaded = true;
		}

		this.show();
	}

	public close(destroy = false) {
		console.log(`🚀closing view ${this.name}`);
		this.hide();
		if (destroy) {
			this.clear();
		}
	}

	public clear() {
		this.loaded = false;
		super.clear();
	}

	protected async preload(): Promise<any> {}

	protected setup() {}

	private show() {
		if (this.visible) return;
		this.entities.forEach(e => this.worldEngine.addEntity(e));
		this.systems.forEach(s => this.worldEngine.addSystem(s));
		this.queries.forEach(q => this.worldEngine.addQuery(q));
		this.visible = true;
	}

	private hide() {
		if (!this.visible) return;
		this.entities.forEach(e => this.worldEngine.removeEntity(e));
		this.systems.forEach(s => this.worldEngine.removeSystem(s));
		this.queries.forEach(q => this.worldEngine.removeQuery(q));
		this.visible = false;
	}
}
