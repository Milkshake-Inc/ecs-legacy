import { Entity } from '@ecs/ecs/Entity';
import Camera from '@ecs/plugins/camera/components/Camera';
import CameraRenderSystem from '@ecs/plugins/camera/systems/CameraRenderSystem';
import Transform from '@ecs/plugins/Transform';
import RenderSystem from '@ecs/plugins/render/systems/RenderSystem';
import TickerEngine from '@ecs/TickerEngine';

export class PixiEngine extends TickerEngine {
	constructor(tickRate = 60) {
		super(tickRate);

		this.addSystem(new CameraRenderSystem());
		this.addSystem(new RenderSystem());

		const camera = new Entity();
		camera.add(Transform);
		camera.add(Camera);
		this.addEntities(camera);
	}
}
