import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { useQueries, useState } from '@ecs/ecs/helpers/StatefulSystems';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import MathHelper from '@ecs/math/MathHelper';
import Vector2 from '@ecs/math/Vector2';
import Position from '@ecs/plugins/Position';
import Bounds from '@ecs/plugins/render/components/Bounds';
import RenderState from '@ecs/plugins/render/components/RenderState';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { RenderTexture, Sprite } from 'pixi.js';
import Camera from '../components/Camera';
import CameraRenderState from '../components/CameraRenderState';
import CameraTarget from '../components/CameraTarget';

export default class CameraRenderSystem extends IterativeSystem {
	protected state = useState(this, new CameraRenderState());

	protected queries = useQueries(this, {
		rendererState: all(RenderState),
		targets: all(CameraTarget)
	});

	constructor() {
		super(makeQuery(all(Camera, Position)));
	}

	public entityAdded = (snapshot: EntitySnapshot) => {
		const camera = snapshot.get(Camera);
		const sprite = new Sprite(RenderTexture.create({ width: camera.width, height: camera.height }));
		this.state.renderSprites.set(camera, sprite);
		this.renderState.application.stage.addChild(sprite);
	};

	public updateEntity(entity: Entity, dt: number) {
		const camera = entity.get(Camera);
		const position = entity.get(Position);

		if (camera.scrollOptions) {
			this.scrollTargets(camera, position);
		}

		this.updateCamera(camera, position);
	}

	public scrollTargets(camera: Camera, position: Position) {
		const targets = this.queries.targets;
		if (targets.length <= 0) return;

		const min = Object.assign({}, targets.first.get(Position));
		const max = Object.assign({}, targets.first.get(Position));
		const options = camera.scrollOptions;

		for (const target of targets.entities) {
			const bounds = target.get(Bounds);
			const position = target.get(Position);

			if (options.bounded && target.has(Bounds)) {
				if (bounds.min.x < min.x) min.x = bounds.min.x;
				if (bounds.max.x > max.x) max.x = bounds.max.x;
				if (bounds.min.y < min.y) min.y = bounds.min.y;
				if (bounds.max.y > max.y) max.y = bounds.max.y;
			} else {
				if (position.x < min.x) min.x = position.x;
				if (position.x > max.x) max.x = position.x;
				if (position.y < min.y) min.y = position.y;
				if (position.y > max.y) max.y = position.y;
			}
		}

		const x = min.x - options.padding;
		const y = min.y - options.padding;
		const width = max.x - min.x + options.padding * 2;
		const height = max.y - min.y + options.padding * 2;

		// This should use camera view?
		const widthDiff: number = camera.width / width;
		const heightDiff: number = camera.height / height;

		position.x = x + width / 2;
		position.y = y + height / 2;
		camera.offset = Vector2.ZERO;
		camera.zoom = MathHelper.clamp(Math.min(widthDiff, heightDiff), options.maxZoom, options.minZoom);
	}

	public updateCamera(camera: Camera, position: Position) {
		const sprite = this.state.renderSprites.get(camera);
		sprite.x = camera.x;
		sprite.y = camera.y;

		// Update viewport
		const newWidth = this.screenWidth * (1 / camera.zoom);
		const newHeight = this.screenHeight * (1 / camera.zoom);

		const offsetX = newWidth * 0.5;
		const offsetY = newHeight * 0.5;

		camera.transform.position.x = -(position.x + camera.offset.x) * camera.zoom;
		camera.transform.position.y = -(position.y + camera.offset.y) * camera.zoom;
		camera.transform.scale.x = camera.zoom;
		camera.transform.scale.y = camera.zoom;
		camera.transform.rotation = position.r;
		camera.transform.pivot.x = -offsetX;
		camera.transform.pivot.y = -offsetY;
	}

	protected get screenWidth() {
		return this.renderState.application.view.width;
	}

	protected get screenHeight() {
		return this.renderState.application.view.height;
	}

	protected get renderState() {
		return this.queries.rendererState.first.get(RenderState);
	}
}
