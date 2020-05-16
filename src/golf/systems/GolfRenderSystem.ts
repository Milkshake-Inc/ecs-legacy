import { useState } from '@ecs/ecs/helpers';
import RenderSystem from '@ecs/plugins/3d/systems/RenderSystem';
import { Camera, Fog, OrthographicCamera, PCFSoftShadowMap, PerspectiveCamera, Scene } from 'three';

export class GolfRenderState {
    public uiScene: Scene;
    public uiCamera: OrthographicCamera;
}

export default class GolfRenderSystem extends RenderSystem {

    protected golfRenderState = useState(this, new GolfRenderState());

	constructor() {
		super({
			color: 0x262626,
            configure: (renderer, scene) => {
                // renderer.setPixelRatio(2);
                renderer.shadowMap.type = PCFSoftShadowMap;
                renderer.shadowMap.enabled = true;

                scene.fog = new Fog(0x262626, 10, 200);
            }
        });

        const width = 1280;
        const height = 720;
        this.golfRenderState.uiCamera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 2);
        this.golfRenderState.uiCamera.position.z = 1;
        this.golfRenderState.uiScene = new Scene();

        this.state.renderer.autoClear = false;
    }

	render() {
		this.queries.camera.forEach(entity => {
			let camera = entity.get(Camera);
			if (entity.has(PerspectiveCamera)) {
				camera = entity.get(PerspectiveCamera);
			}

			if (!camera) return;

            this.state.renderer.render(this.state.scene, camera);
            this.state.renderer.render(this.golfRenderState.uiScene, this.golfRenderState.uiCamera);
		});
	}
}
