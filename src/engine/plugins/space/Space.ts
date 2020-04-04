import { Engine } from '@ecs/ecs/Engine';
import { Loader } from 'pixi.js';
import { Entity } from '@ecs/ecs/Entity';
import SpaceTag from './components/SpaceTag';

export default class Space extends Engine {
	public readonly name: string;

	protected loader = Loader.shared;
	protected worldEngine: Engine;
	protected loaded = false;
	protected visible = false;

	constructor(engine: Engine, name: string) {
		super();

		this.name = name;
		this.worldEngine = engine;
	}

	public addEntity(entity: Entity) {
		entity.addComponent(SpaceTag, { spaceName: this.name });
		return super.addEntity(entity);
	}

	public async open(reset = false) {
		console.log(`🚀opening space ${this.name}`);
		if (reset || !this.loaded) {
			this.clear();
			await this.preload();
			this.setup();
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

	protected setup() {}

	private async preload(content: { [index: string]: string } = {}) {
		this.loader.add(Object.values(content));

		await new Promise(resolve => {
			this.loader.load(resolve);
		});

		this.loaded = true;
	}

	public clear() {
		this.loaded = false;
		this.loader.reset();
		super.clear();
	}

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
