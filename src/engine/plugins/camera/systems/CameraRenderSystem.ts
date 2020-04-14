import { all, makeQuery } from '@ecs/utils/QueryHelper';
import Camera from '../components/Camera';
import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { Sprite, RenderTexture } from 'pixi.js';
import Position from '@ecs/plugins/Position';
import { StatefulIterativeSystem } from '@ecs/ecs/helpers/StatefulSystems';
import RenderState from '@ecs/plugins/render/components/RenderState';
import { Query } from '@ecs/ecs/Query';
import CameraState from '../components/CameraRenderState';
import CameraRenderState from '../components/CameraRenderState';

type Queries = {
	rendererState: Query;
};

export default class CameraRenderSystem extends StatefulIterativeSystem<CameraState, Queries> {
	constructor() {
		super(makeQuery(all(Camera, Position)), new CameraRenderState(), {
			rendererState: makeQuery(all(RenderState))
		});
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
