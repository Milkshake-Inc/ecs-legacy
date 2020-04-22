import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
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
	Graphics,
	RenderTexture
} from 'pixi.js';
import DisplayObject from '../components/DisplayObject';
import Sprite from '../components/Sprite';
import BitmapText from '../components/BitmapText';
import ParticleEmitter from '../components/ParticleEmitter';
import { Emitter as PixiParticleEmitter } from 'pixi-particles';
import { StatefulIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import RenderState from '../components/RenderState';
import { Query } from '@ecs/ecs/Query';
import CameraRenderState from '@ecs/plugins/camera/components/CameraRenderState';

type Queries = {
	cameraState: Query;
};

export default class RenderSystem extends StatefulIterativeSystem<RenderState, Queries> {
	protected defaultRenderSprite: PixiSprite;
	protected displayObjects: Map<DisplayObject, PixiDisplayObject> = new Map();
	protected emitters: Map<ParticleEmitter, PixiParticleEmitter> = new Map();

	constructor(width = 1280, height = 720, backgroundColor = 0xff0000, scale = 1) {
		super(
			makeQuery(all(Position), any(Sprite, BitmapText, Graphics, ParticleEmitter)),
			new RenderState(
				new Container(),
				new Application({
					view: <HTMLCanvasElement>document.getElementById('canvas'),
					backgroundColor,
					width,
					height,
					// resolution: window.devicePixelRatio,
					antialias: false,
					autoStart: false
				})
			),
			{
				cameraState: makeQuery(all(CameraRenderState))
			}
		);

		this.state.application.stage.addChild((this.defaultRenderSprite = new PixiSprite(RenderTexture.create({ width, height }))));

		this.state.container.scale.set(scale, scale);
		this.state.container.sortableChildren = true;

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
		if (entity.has(Sprite) && !this.displayObjects.has(entity.get(Sprite))) {
			const sprite = entity.get(Sprite);
			const pixiSprite = new PixiSprite(new Texture(BaseTexture.from(sprite.imageUrl), sprite.frame));

			this.displayObjects.set(sprite, pixiSprite);
			this.state.container.addChild(pixiSprite);
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

			this.state.container.removeChild(this.displayObjects.get(sprite));
			this.displayObjects.delete(sprite);
		}

		if (snapshot.has(BitmapText)) {
			const text = snapshot.get(BitmapText);

			this.state.container.removeChild(this.displayObjects.get(text));
			this.displayObjects.delete(text);
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
	}

	onRemovedFromEngine() {
		this.state.application.stage.removeChild(this.state.container);
	}
}
