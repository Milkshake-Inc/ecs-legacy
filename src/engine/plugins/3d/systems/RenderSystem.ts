import { useState, useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { usePerspectiveCameraCouple } from '../couples/PerspectiveCameraCouple';
import { useMeshCouple } from '../couples/MeshCouple';
import RenderState from '../components/RenderState';
import { Scene, WebGLRenderer, PerspectiveCamera, Camera, Color as ThreeColor } from 'three';
import { any } from '@ecs/utils/QueryHelper';
import { useGroupCouple } from '../couples/GroupCouple';
import Color from '@ecs/math/Color';
import { useLightCouple } from '../couples/LightCouple';

export default class RenderSystem extends System {
	protected state = useState(this, new RenderState());

	protected queries = useQueries(this, {
		camera: any(Camera, PerspectiveCamera)
	});

	// Query passed in must be added to engine.... & update has to be called manually
	protected couples = [usePerspectiveCameraCouple(this), useMeshCouple(this), useGroupCouple(this), useLightCouple(this)];

	constructor(width = 1280, height = 720, color: number = Color.White) {
		super();

		this.state.scene = new Scene();
		this.state.scene.background = new ThreeColor(color);

		this.state.renderer = new WebGLRenderer({
			antialias: true
		});
		this.state.renderer.setSize(width, height);

		(window as any).renderSystem = this;

		document.body.appendChild(this.state.renderer.context.canvas as HTMLCanvasElement);
	}

	update(dt: number) {
		super.update(dt);

		this.couples.forEach(couple => couple.update(dt));

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
