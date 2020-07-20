import RenderSystem from '@ecs/plugins/3d/systems/RenderSystem';
import { Camera, Fog, PerspectiveCamera } from 'three';
import { useSDFTextCouple } from './render/useSDFTextCouple';
import Config from '../../utils/Config';

const width = window.innerWidth;
const height = window.innerHeight;
const fov = 75;

export default class GolfRenderSystem extends RenderSystem {
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

		// Maybe tweak this based on performance...
		this.state.renderer.setPixelRatio(window.devicePixelRatio);
		this.state.renderer.autoClear = false;

		// Styling
		this.state.renderer.domElement.autofocus = true;
		document.documentElement.style.margin = document.body.style.margin = '0px';
		document.documentElement.style.overflow = document.body.style.overflow = 'hidden';
		document.body.style.background = '#111111';

		// Resize events to make fullscreen
		window.addEventListener('orientationchange', () => this.resize());
		window.addEventListener('resize', () => this.resize());

		if (Config.debug) {
			(function () {
				const old = console.log;
				const logger = document.createElement('div');
				document.body.prepend(logger);
				logger.style.color = 'white';
				console.log = function (...message) {
					logger.innerHTML = JSON.stringify(message);
				};
			})();
		}
	}

	get width() {
		return window.innerWidth;
	}

	get height() {
		return window.innerHeight;
	}

	resize() {
		this.state.renderer.setSize(this.width, this.height, true);
	}

	render() {
		this.queries.camera.forEach(entity => {
			const camera = entity.get(Camera) || entity.get(PerspectiveCamera);

			if (!camera) return;

			// Update cam aspect and fov if changed
			if (camera instanceof PerspectiveCamera) {
				const aspect = this.width / this.height;

				if (camera.aspect != aspect || camera.fov != fov) {
					camera.fov = fov;
					camera.aspect = aspect;
					camera.updateProjectionMatrix();
				}
			}

			this.state.renderer.render(this.state.scene, camera);
		});
	}
}
