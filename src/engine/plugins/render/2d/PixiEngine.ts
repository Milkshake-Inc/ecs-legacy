import { Entity } from '@ecs/core/Entity';
import Camera from '@ecs/plugins/render/2d/components/Camera';
import PixiCameraSystem from '@ecs/plugins/render/2d/systems/PixiCameraSystem';
import Transform from '@ecs/plugins/math/Transform';
import PixiRenderSystem from '@ecs/plugins/render/2d/systems/PixiRenderSystem';
import TickerEngine from '@ecs/core/TickerEngine';
import Color from '@ecs/plugins/math/Color';

export class PixiEngine extends TickerEngine {
	constructor(tickRate = 60, backgroundColor = Color.Tomato) {
		super(tickRate);

		this.addSystem(new PixiCameraSystem());
		this.addSystem(new PixiRenderSystem());

		const camera = new Entity();
		camera.add(Transform);
		camera.add(Camera);
		this.addEntities(camera);
	}
}
