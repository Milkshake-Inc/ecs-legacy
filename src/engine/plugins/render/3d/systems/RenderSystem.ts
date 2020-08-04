import { useState, useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { usePerspectiveCameraCouple } from '../couples/PerspectiveCameraCouple';
import { useMeshCouple } from '../couples/MeshCouple';
import RenderState from '../components/RenderState';
import { Scene, WebGLRenderer, PerspectiveCamera, Camera, Color as ThreeColor, sRGBEncoding } from 'three';
import { any } from '@ecs/ecs/Query';
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
		useRaycastDebugCouple(this)
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
			antialias: false, // Bad performance on OSX. TODO optionally enable these...
			alpha: false
		});

		this.state.renderer.outputEncoding = sRGBEncoding;
		this.state.renderer.setSize(settings.width, settings.height);
		this.state.renderer.setClearAlpha(1.0);

		if (settings.configure) {
			settings.configure(this.state.renderer, this.state.scene);
		}

		(window as any).renderSystem = this;

		document.body.appendChild(this.state.renderer.context.canvas as HTMLCanvasElement);
		this.render();
	}

	updateFixed(dt: number) {
		super.updateFixed(dt);

		this.couples.forEach(couple => couple.update(dt));
	}

	updateLate(dt: number) {
		super.updateLate(dt);

		this.couples.forEach(couple => couple.lateUpdate(dt));
	}

	updateRender(dt: number) {
		super.updateRender(dt);

		this.render();
	}

	render() {
		this.queries.camera.forEach(entity => {
			let camera = entity.get(Camera);
			if (entity.has(PerspectiveCamera)) {
				camera = entity.get(PerspectiveCamera);
			}

			if (!camera) return;

			this.state.renderer.render(this.state.scene, camera);
		});
	}
}
