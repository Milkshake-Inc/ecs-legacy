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
	Texture
} from 'pixi.js';
import DisplayObject from '../components/DisplayObject';
import Sprite from '../components/Sprite';
import BitmapText from '../components/BitmapText';

export default class RenderSystem extends IterativeSystem {
	public application: Application;

	public container: Container;

	displayObjects: Map<DisplayObject, PixiDisplayObject>;

	constructor(width = 1280, height = 720, backgroundColor = 0xff0000, scale = 1) {
		super(makeQuery(all(Position), any(Sprite, BitmapText)));

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

		this.displayObjects = new Map();

		document.body.appendChild(this.application.view);
	}

	protected updateEntity(entity: Entity): void {
		const genericDisplayObjectUpdate = (displayObject: PixiDisplayObject, displayObjectData: DisplayObject) => {
			const position = entity.get(Position);

			displayObject.position.set(position.x, position.y);
			displayObject.scale.set(displayObjectData.scale.x, displayObjectData.scale.y);

			// Dirty sorting stuff - remove / change
			if (displayObjectData.index != null) {
				this.container.setChildIndex(displayObject, this.container.children.length - 1);
			}
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

			genericDisplayObjectUpdate(pixiSprite, sprite);
		}
	}

	entityAdded = (snapshot: EntitySnapshot) => {
		if (snapshot.has(Sprite)) {
			const sprite = snapshot.get(Sprite);
			const pixiSprite = new PixiSprite(new Texture(BaseTexture.from(sprite.imageUrl), sprite.frame));

			this.displayObjects.set(sprite, pixiSprite);
			this.container.addChild(pixiSprite);

			this.updateEntity(snapshot.entity);
		}

		if (snapshot.has(BitmapText)) {
			const bitmapText = snapshot.get(BitmapText);

			const pixiBitmapText = new PixiText(bitmapText.text, {
				fontFamily: bitmapText.font,
				fontSize: bitmapText.size,
				fill: bitmapText.tint
			} as PIXI.TextStyle);
			pixiBitmapText.roundPixels = true;

			this.displayObjects.set(bitmapText, pixiBitmapText);
			this.container.addChild(pixiBitmapText);

			this.updateEntity(snapshot.entity);
		}
	};

	entityRemoved = (snapshot: EntitySnapshot) => {
		if (snapshot.has(Sprite)) {
			const sprite = snapshot.get(Sprite);

			this.container.removeChild(this.displayObjects.get(sprite));
			this.displayObjects.delete(sprite);
		}
	};

	public update(dt: number) {
		super.update(dt);
		this.application.render();
	}

	onRemovedFromEngine() {
		this.application.stage.removeChild(this.container);
	}
}
