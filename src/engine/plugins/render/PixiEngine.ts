import { Entity } from '@ecs/ecs/Entity';
import Camera from '@ecs/plugins/camera/components/Camera';
import CameraRenderSystem from '@ecs/plugins/camera/systems/CameraRenderSystem';
import Transform from '@ecs/plugins/Transform';
import RenderSystem from '@ecs/plugins/render/systems/RenderSystem';
import Space from '@ecs/plugins/space/Space';
import TickerEngine from '@ecs/TickerEngine';

export class PixiEngine extends TickerEngine {
	protected spaces: Map<string, Space>;

	constructor(tickRate = 60) {
		super(tickRate);

		this.addSystem(new CameraRenderSystem());
		this.addSystem(new RenderSystem());

		const camera = new Entity();
		camera.add(Transform);
		camera.add(Camera);
		this.addEntities(camera);

		this.spaces = new Map();
	}

	public getSpace(spaceName: string) {
		return this.spaces.get(spaceName);
	}

	public registerSpaces(...spaces: Space[]) {
		spaces.forEach(v => this.spaces.set(v.name, v));
	}

	protected getTime(): number {
		return performance.now();
	}

	protected buildCallback(callback: () => void) {
		const handleAnimationFrame = () => {
			callback();
			requestAnimationFrame(handleAnimationFrame);
		};

		requestAnimationFrame(handleAnimationFrame);
	}
}
