import { useState, useQueries } from '@ecs/core/helpers';
import { System, any } from 'tick-knock';
import { usePerspectiveCameraCouple } from '../couples/PerspectiveCameraCouple';
import { useArrowHelperCouple, useMeshCouple } from '../couples/MeshCouple';
import RenderState from '../components/RenderState';
import { Scene, WebGLRenderer, PerspectiveCamera, Camera, Color as ThreeColor, sRGBEncoding } from 'three';
import { useGroupCouple } from '../couples/GroupCouple';
import Color from '@ecs/plugins/math/Color';
import { useLightCouple } from '../couples/LightCouple';
import { useRaycastDebugCouple, useRaycastCouple } from '../couples/RaycasterCouple';
import { useThreeCouple } from '../couples/ThreeCouple';

export type RenderSystemSettings = {
	width: number;
	height: number;
	color: number;
	configure?: (renderer: WebGLRenderer, scene: Scene) => void;
};

export const DefaultRenderSystemSettings: RenderSystemSettings = {
	width: 1280,
	height: 720,
	color: Color.Tomato
};

const isMac = () => {
	return window.navigator.platform == 'MacIntel';
};

export default class RenderSystem extends System {
	protected state = useState(this, new RenderState());

	protected queries = useQueries(this, {
		camera: any(Camera, PerspectiveCamera)
	});

	// Query passed in must be added to engine.... & update has to be called manually
	protected couples = [
		usePerspectiveCameraCouple(this),
		useMeshCouple(this),
		useGroupCouple(this),
		useLightCouple(this),
		useRaycastCouple(this),
		useRaycastDebugCouple(this),
		useArrowHelperCouple(this)
	];

	constructor(
		customSettings?: Partial<RenderSystemSettings>,
		customCouples?: (system: RenderSystem) => ReturnType<typeof useThreeCouple>[]
	) {
		super();

		const settings = {
			...DefaultRenderSystemSettings,
			...customSettings
		};

		if (customCouples) {
			this.couples.push(...(customCouples(this) as any));
		}

		this.state.scene = new Scene();
		this.state.scene.background = new ThreeColor(settings.color);

		this.state.renderer = new WebGLRenderer({
			antialias: !isMac(),
			alpha: false
		});

		// this.state.renderer.outputEncoding = sRGBEncoding;
		this.state.renderer.setSize(settings.width, settings.height);
		this.state.renderer.setClearAlpha(1.0);

		if (settings.configure) {
			settings.configure(this.state.renderer, this.state.scene);
		}

		document.body.appendChild(this.state.renderer.getContext().canvas as HTMLCanvasElement);
	}

	update(dt: number, frameDelta: number) {
		super.update(dt, frameDelta);

		this.queries.camera.forEach(entity => {
			const camera = entity.get(Camera) || entity.get(PerspectiveCamera);

			if (!camera) return;

			// Update cam aspect and fov if changed
			if (camera instanceof PerspectiveCamera) {
				const fov = 70;
				const aspect = window.innerWidth / window.innerHeight;

				if (camera.aspect != aspect || camera.fov != fov) {
					camera.fov = fov;
					camera.aspect = aspect;
					camera.updateProjectionMatrix();
				}
			}

			this.state.renderer.render(this.state.scene, camera);
		});

		this.couples.forEach(couple => couple.update(dt, frameDelta));
	}

	updateLate(dt: number) {
		super.updateLate(dt);

		this.couples.forEach(couple => couple.lateUpdate(dt));
	}
}
