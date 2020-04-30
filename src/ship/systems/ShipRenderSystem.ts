import { useState } from '@ecs/ecs/helpers';
import Color from '@ecs/math/Color';
import RenderSystem from '@ecs/plugins/3d/systems/RenderSystem';
import { DepthFormat, DepthTexture, NearestFilter, RGBFormat, Scene, WebGLRenderTarget, Camera, PerspectiveCamera } from 'three';

export class ShipRenderState {
	public depthTarget: WebGLRenderTarget;
	public waterScene: Scene;
}

export default class ShipRenderSystem extends RenderSystem {
	protected waterState = useState(this, new ShipRenderState());

	constructor(width = 1280, height = 720, color: number = Color.White) {
		super(width, height, color);

		this.waterState.waterScene = new Scene();

		this.waterState.depthTarget = new WebGLRenderTarget(width + 1, height);
		this.waterState.depthTarget.texture.format = RGBFormat;
		this.waterState.depthTarget.texture.minFilter = NearestFilter;
		this.waterState.depthTarget.texture.magFilter = NearestFilter;
		this.waterState.depthTarget.texture.generateMipmaps = false;
		this.waterState.depthTarget.stencilBuffer = false;
		this.waterState.depthTarget.depthBuffer = true;
		this.waterState.depthTarget.depthTexture = new DepthTexture(width, height);
		this.waterState.depthTarget.depthTexture.format = DepthFormat;
	}

	render() {
		this.queries.camera.forEach(entity => {
			let camera = entity.get(Camera);
			if (entity.has(PerspectiveCamera)) {
				camera = entity.get(PerspectiveCamera);
			}

			if (!camera) return;

			const renderer = this.state.renderer;
			renderer.autoClear = false;

			renderer.setRenderTarget(this.waterState.depthTarget);
			renderer.clear(true, true, true);
			renderer.render(this.state.scene, camera);

			renderer.setRenderTarget(null);
			renderer.clear(true, true, true);

			renderer.render(this.state.scene, camera);
			// renderer.clear(true, true, true);
			renderer.setRenderTarget(null);
			renderer.render(this.waterState.waterScene, camera);
		});
	}
}
