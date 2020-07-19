import { useState } from '@ecs/ecs/helpers';
import RenderSystem from '@ecs/plugins/3d/systems/RenderSystem';
import { Camera, Fog, OrthographicCamera, PerspectiveCamera, Scene } from 'three';
import { useSDFTextCouple } from './render/useSDFTextCouple';

export class GolfRenderState {
	public uiScene: Scene;
	public uiCamera: OrthographicCamera;
	public canvas: HTMLCanvasElement;
}

const width = window.innerWidth;
const height = window.innerHeight;

export default class GolfRenderSystem extends RenderSystem {
	protected golfRenderState = useState(this, new GolfRenderState());

	constructor() {
		super(
			{
				color: 0x262626,
				configure: (renderer, scene) => {
					renderer.shadowMap.enabled = true;

					scene.fog = new Fog(0x262626, 10, 200);
				},
				width,
				height
			},
			system => [useSDFTextCouple(system)]
		);

		this.golfRenderState.canvas = this.state.renderer.domElement;
		this.golfRenderState.canvas.autofocus = true;

		this.golfRenderState.uiCamera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 2);
		this.golfRenderState.uiCamera.position.z = 1;
		this.golfRenderState.uiScene = new Scene();

		this.state.renderer.autoClear = false;

		this.state.renderer.domElement.style.width = '100%';
		this.state.renderer.domElement.style.height = '100%';
		document.documentElement.style.margin = document.body.style.margin = '0px';
		document.documentElement.style.overflow = document.body.style.overflow = 'hidden';
		document.body.style.background = '#111111';

		window.addEventListener('resize', () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			this.golfRenderState.canvas.width = width;
			this.golfRenderState.canvas.height = height;

			this.state.renderer.setViewport(0, 0, width, height);

			this.golfRenderState.uiCamera.setViewOffset(width / -2, width / 2, height / 2, height / -2, 1, 2);
			this.golfRenderState.uiCamera.updateProjectionMatrix();

			this.queries.camera.forEach(entity => {
				if (entity.has(PerspectiveCamera)) {
					const cam = entity.get(PerspectiveCamera);
					cam.fov = 75;
					cam.aspect = width / height;
					cam.updateProjectionMatrix();
				}
			});
		});
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
