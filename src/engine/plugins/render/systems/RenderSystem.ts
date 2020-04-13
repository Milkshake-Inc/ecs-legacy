import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import {
	Application,
	BaseTexture,
	Container,
	DisplayObject as PixiDisplayObject,
	Sprite as PixiSprite,
	BitmapText as PixiBitmapText,
	Text as PixiText,
	Texture,
	Graphics
} from 'pixi.js';
import DisplayObject from '../components/DisplayObject';
import Sprite from '../components/Sprite';
import BitmapText from '../components/BitmapText';
import ParticleEmitter from '../components/ParticleEmitter';
import { Emitter as PixiParticleEmitter } from 'pixi-particles';

export default class RenderSystem extends IterativeSystem {
	public application: Application;

	public container: Container;

	protected displayObjects: Map<DisplayObject, PixiDisplayObject> = new Map();
	protected emitters: Map<ParticleEmitter, PixiParticleEmitter> = new Map();

	constructor(width = 1280, height = 720, backgroundColor = 0xff0000, scale = 1) {
		super(makeQuery(all(Position), any(Sprite, BitmapText, Graphics, ParticleEmitter)));

		this.application = new Application({
			view: <HTMLCanvasElement>document.getElementById('canvas'),
			backgroundColor,
			width,
			height,
			// resolution: window.devicePixelRatio,
			antialias: false,
			autoStart: false
		});

		this.application.stage.addChild((this.container = new Container()));
		this.container.scale.set(scale, scale);
		this.container.sortableChildren = true;

		document.body.appendChild(this.application.view);
	}

	protected updateEntity(entity: Entity): void {
		const genericDisplayObjectUpdate = (displayObject: PixiDisplayObject, displayObjectData: DisplayObject) => {
			const position = entity.get(Position);

			displayObject.position.set(position.x, position.y);
			displayObject.scale.set(displayObjectData.scale.x, displayObjectData.scale.y);
			displayObject.zIndex = position.z;
		};

		if (entity.has(Sprite)) {
			const sprite = entity.get(Sprite);
			const pixiSprite = this.displayObjects.get(sprite) as PixiSprite;

			genericDisplayObjectUpdate(pixiSprite, sprite);

			if (sprite.frame && pixiSprite.texture.baseTexture.resource.valid) {
				pixiSprite.texture.frame = sprite.frame;
			}

			pixiSprite.tint = sprite.tint;
			pixiSprite.anchor.set(sprite.anchor.x, sprite.anchor.y);
		}

		if (entity.has(BitmapText)) {
			const sprite = entity.get(BitmapText);
			const pixiSprite = this.displayObjects.get(sprite) as PixiBitmapText;

			pixiSprite.text = sprite.text;
			pixiSprite.tint = sprite.tint;
			pixiSprite.align = sprite.align;
			(pixiSprite.anchor as any).x = sprite.anchor.x;
			(pixiSprite.anchor as any).y = sprite.anchor.y;

			genericDisplayObjectUpdate(pixiSprite, sprite);
		}

		if (entity.has(Graphics)) {
			const graphics = entity.get(Graphics);
			const position = entity.get(Position);

			graphics.position.set(position.x, position.y);
		}

		if (entity.has(ParticleEmitter)) {
			const emitter = entity.get(ParticleEmitter);
			const position = entity.get(Position);

			const pixiEmitter = this.emitters.get(emitter) as PixiParticleEmitter;
			const emitterContainer = pixiEmitter.parent;

			pixiEmitter.updateSpawnPos(position.x + emitter.offset.x, position.y + emitter.offset.y);
			pixiEmitter.emit = emitter.emit;
			emitterContainer.scale.set(emitter.scale.x, emitter.scale.y);
			emitterContainer.zIndex = position.z;
		}
	}

	onComponentAdded = (entity: Entity) => {
		if (entity.has(Sprite) && !this.displayObjects.has(entity.get(Sprite))) {
			const sprite = entity.get(Sprite);
			const pixiSprite = new PixiSprite(new Texture(BaseTexture.from(sprite.imageUrl), sprite.frame));

			this.displayObjects.set(sprite, pixiSprite);
			this.container.addChild(pixiSprite);
		}

		if (entity.has(BitmapText) && !this.displayObjects.has(entity.get(BitmapText))) {
			const bitmapText = entity.get(BitmapText);

			const pixiBitmapText = new PixiText(bitmapText.text, {
				fontFamily: bitmapText.font,
				fontSize: bitmapText.size,
				fill: bitmapText.tint,
				align: bitmapText.align
			} as PIXI.TextStyle);
			pixiBitmapText.roundPixels = true;

			this.displayObjects.set(bitmapText, pixiBitmapText);
			this.container.addChild(pixiBitmapText);
		}

		if (entity.has(Graphics) && !this.container.children.includes(entity.get(Graphics))) {
			const graphics = entity.get(Graphics);

			this.container.addChild(graphics);
		}

		if (entity.has(ParticleEmitter) && !this.emitters.has(entity.get(ParticleEmitter))) {
			const emitter = entity.get(ParticleEmitter);
			const pixiParticleContainer = new Container();
			const pixiEmitter = new PixiParticleEmitter(
				pixiParticleContainer,
				emitter.textures.map(t => Texture.from(t)),
				emitter.config
			);

			this.emitters.set(emitter, pixiEmitter);
			this.container.addChild(pixiParticleContainer);
		}

		this.updateEntity(entity);
	};

	entityAdded = (snapshot: EntitySnapshot) => {
		snapshot.entity.onComponentAdded.connect(this.onComponentAdded.bind(this));
		this.onComponentAdded(snapshot.entity);
	};

	entityRemoved = (snapshot: EntitySnapshot) => {
		snapshot.entity.onComponentRemoved.disconnect(this.onComponentAdded.bind(this));

		if (snapshot.has(Sprite)) {
			const sprite = snapshot.get(Sprite);

			this.container.removeChild(this.displayObjects.get(sprite));
			this.displayObjects.delete(sprite);
		}

		if (snapshot.has(BitmapText)) {
			const text = snapshot.get(BitmapText);

			this.container.removeChild(this.displayObjects.get(text));
			this.displayObjects.delete(text);
		}

		if (snapshot.has(Graphics)) {
			const graphics = snapshot.get(Graphics);

			this.container.removeChild(graphics);
		}

		if (snapshot.has(ParticleEmitter)) {
			const emitter = snapshot.get(ParticleEmitter);

			this.container.removeChild(this.emitters.get(emitter).parent);
			this.emitters.delete(emitter);
		}
	};

	public update(dt: number) {
		super.update(dt);
		this.application.render();

		for (const emitter of this.emitters.values()) {
			emitter.update(dt * 0.001);
		}
	}

	onRemovedFromEngine() {
		this.application.stage.removeChild(this.container);
	}
}
