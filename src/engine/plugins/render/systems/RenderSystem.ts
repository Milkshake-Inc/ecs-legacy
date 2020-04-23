import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { useQueries, useState } from '@ecs/ecs/helpers/StatefulSystems';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import CameraRenderState from '@ecs/plugins/camera/components/CameraRenderState';
import Position from '@ecs/plugins/Position';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { Emitter as PixiParticleEmitter } from 'pixi-particles';
import {
	Application,
	BaseTexture,
	BitmapText as PixiBitmapText,
	Container,
	DisplayObject as PixiDisplayObject,
	Graphics,
	RenderTexture,
	resources,
	Sprite as PixiSprite,
	Text as PixiText,
	Texture
} from 'pixi.js';
import BitmapText from '../components/BitmapText';
import DisplayObject from '../components/DisplayObject';
import ParticleEmitter from '../components/ParticleEmitter';
import RenderState from '../components/RenderState';
import Sprite from '../components/Sprite';

export default class RenderSystem extends IterativeSystem {
	protected state = useState(this, new RenderState());
	protected queries = useQueries(this, {
		cameraState: all(CameraRenderState)
	});

	protected defaultRenderSprite: PixiSprite;
	// protected displayObjects: ;
	protected emitters: Map<ParticleEmitter, PixiParticleEmitter> = new Map();

	constructor(width = 1280, height = 720, backgroundColor = 0xff0000, scale = 1) {
		super(makeQuery(all(Position), any(Sprite, BitmapText, Graphics, ParticleEmitter)));

		this.state.container = new Container();
		this.state.application = new Application({
			view: <HTMLCanvasElement>document.getElementById('canvas'),
			backgroundColor,
			width,
			height,
			// resolution: window.devicePixelRatio,
			antialias: false,
			autoStart: false
		});

		this.state.application.renderer.plugins.interaction.useSystemTicker = false;

		this.state.application.stage.addChild((this.defaultRenderSprite = new PixiSprite(RenderTexture.create({ width, height }))));

		console.log(this.state.application.stage);

		this.state.container.scale.set(scale, scale);
		this.state.container.sortableChildren = true;
		this.state.container.interactive = true;
		this.state.container.interactiveChildren = true;

		document.body.appendChild(this.state.application.view);
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
			const pixiSprite = this.state.displayObjects.get(sprite) as PixiSprite;

			genericDisplayObjectUpdate(pixiSprite, sprite);

			if (sprite.frame && pixiSprite.texture.baseTexture.resource.valid) {
				pixiSprite.texture.frame = sprite.frame;
			}

			if (sprite.imageUrl && (pixiSprite.texture.baseTexture.resource as resources.ImageResource).url) {
				pixiSprite.texture = Texture.from(sprite.imageUrl);
			}

			pixiSprite.tint = sprite.tint;
			pixiSprite.anchor.set(sprite.anchor.x, sprite.anchor.y);
		}

		if (entity.has(BitmapText)) {
			const sprite = entity.get(BitmapText);
			const pixiSprite = this.state.displayObjects.get(sprite) as PixiBitmapText;

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
			graphics.zIndex = position.z;
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
		if (entity.has(Sprite) && !this.state.displayObjects.has(entity.get(Sprite))) {
			const sprite = entity.get(Sprite);
			const pixiSprite = new PixiSprite(new Texture(BaseTexture.from(sprite.imageUrl), sprite.frame));

			this.state.displayObjects.set(sprite, pixiSprite);
			this.state.container.addChild(pixiSprite);
		}

		if (entity.has(BitmapText) && !this.state.displayObjects.has(entity.get(BitmapText))) {
			const bitmapText = entity.get(BitmapText);

			const pixiBitmapText = new PixiText(bitmapText.text, {
				fontFamily: bitmapText.font,
				fontSize: bitmapText.size,
				fill: bitmapText.tint,
				align: bitmapText.align
			} as PIXI.TextStyle);
			pixiBitmapText.roundPixels = true;

			this.state.displayObjects.set(bitmapText, pixiBitmapText);
			this.state.container.addChild(pixiBitmapText);
		}

		if (entity.has(Graphics) && !this.state.container.children.includes(entity.get(Graphics))) {
			const graphics = entity.get(Graphics);

			this.state.container.addChild(graphics);
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
			this.state.container.addChild(pixiParticleContainer);
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

			this.state.container.removeChild(this.state.displayObjects.get(sprite));
			this.state.displayObjects.delete(sprite);
		}

		if (snapshot.has(BitmapText)) {
			const text = snapshot.get(BitmapText);

			this.state.container.removeChild(this.state.displayObjects.get(text));
			this.state.displayObjects.delete(text);
		}

		if (snapshot.has(Graphics)) {
			const graphics = snapshot.get(Graphics);

			this.state.container.removeChild(graphics);
		}

		if (snapshot.has(ParticleEmitter)) {
			const emitter = snapshot.get(ParticleEmitter);

			this.state.container.removeChild(this.emitters.get(emitter).parent);
			this.emitters.delete(emitter);
		}
	};

	update(dt: number) {
		super.update(dt);

		for (const emitter of this.emitters.values()) {
			emitter.update(dt * 0.001);
		}

		this.render();
	}

	render() {
		const cameraState = this.queries.cameraState.first?.get(CameraRenderState);
		if (cameraState && cameraState.renderSprites.size > 0) {
			for (const [camera, sprite] of cameraState.renderSprites) {
				this.state.container.setTransform(
					camera.transform.position.x,
					camera.transform.position.y,
					camera.transform.scale.x,
					camera.transform.scale.y,
					camera.transform.rotation,
					camera.transform.skew.x,
					camera.transform.skew.y,
					camera.transform.pivot.x,
					camera.transform.pivot.y
				);

				this.state.application.renderer.render(this.state.container, sprite.texture as RenderTexture, true);
			}
		} else {
			this.state.application.renderer.render(this.state.container, this.defaultRenderSprite.texture as RenderTexture, true);
		}

		this.state.application.render();

		// In order for interaction to work
		(this.state.application.renderer as any)._lastObjectRendered = this.state.container;
		this.state.application.renderer.plugins.interaction.update();
	}

	onRemovedFromEngine() {
		this.state.application.stage.removeChild(this.state.container);
	}
}
