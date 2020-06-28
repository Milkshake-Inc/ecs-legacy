import { Engine } from '@ecs/ecs/Engine';
import { useQueries, useState } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import PixiRenderState from '@ecs/plugins/render/components/RenderState';
import { all } from '@ecs/utils/QueryHelper';
import { DoubleSide, LinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry, Texture } from 'three';
import { GolfRenderState } from '../GolfRenderSystem';

export class PixiUIState {
	public uiTexture: Texture;
}

export default class ClientPixiUISystem extends System {
	protected state = useState(this, new PixiUIState());

	protected queries = useQueries(this, {
		pixiRenderState: all(PixiRenderState),
		uiState: all(GolfRenderState)
	});

	public onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);

		const renderState = this.queries.pixiRenderState.first.get(PixiRenderState);

		this.state.uiTexture = new Texture(renderState.application.view);
		this.state.uiTexture.minFilter = LinearFilter;

		const uiMesh = new Mesh(
			new PlaneGeometry(1280, 720),
			new MeshBasicMaterial({
				map: this.state.uiTexture,
				transparent: true,
				side: DoubleSide
			})
		);

		// Add this to the UI Scene
		const golfRenderState = this.queries.uiState.first.get(GolfRenderState);
		golfRenderState.uiScene.add(uiMesh);

		renderState.application.renderer.plugins.interaction.setTargetElement(golfRenderState.canvas);
	}

	update() {
		this.state.uiTexture.needsUpdate = true;
	}
}
