import { useQueries, useState } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import CameraRenderState from '@ecs/plugins/camera/components/CameraRenderState';
import { all } from '@ecs/utils/QueryHelper';
import { Application, Container, RenderTexture, Sprite as PixiSprite } from 'pixi.js';
import RenderState from '../components/RenderState';
import { useGraphicsCouple } from '../couples/GraphicsCouple';
import { useParticleCouple } from '../couples/ParticleCouple';
import { useSpriteCouple } from '../couples/SpriteCouple';
import { useTextCouple } from '../couples/TextCouple';

export default class RenderSystem extends System {
	protected state = useState(this, new RenderState());

	protected queries = useQueries(this, {
		cameraState: all(CameraRenderState)
	});

	protected defaultRenderSprite: PixiSprite;

	// Query passed in must be added to engine.... & update has to be called manually
	// Maybe you could have TileMapCouplerPlugin - which renders tilemap (ParticleContainer etc)
	// new RenderSystem([ useTileMapCouple ])
	protected couples = [useSpriteCouple(this), useParticleCouple(this), useGraphicsCouple(this), useTextCouple(this)];

	constructor(width = 1280, height = 720, backgroundColor = 0xff0000, scale = 1) {
		super();

		this.state.container = new Container();
		this.state.application = new Application({
			view: <HTMLCanvasElement>document.getElementById('canvas'),
			backgroundColor,
			width,
			height,
			antialias: false,
			autoStart: false
		});

		this.state.application.stage.addChild((this.defaultRenderSprite = new PixiSprite(RenderTexture.create({ width, height }))));

		this.state.container.scale.set(scale, scale);
		this.state.container.sortableChildren = true;

		// Interaction styff
		this.state.application.renderer.plugins.interaction.useSystemTicker = false;
		this.state.container.interactive = true;
		this.state.container.interactiveChildren = true;

		document.body.appendChild(this.state.application.view);
	}

	update(dt: number) {
		super.update(dt);

		this.couples.forEach(couple => couple.update(dt));

		this.render();
	}

	render() {
		const cameraState = this.queries.cameraState.first?.get(CameraRenderState);
		if (cameraState && cameraState.renderSprites.size > 0) {
			for (const [camera, sprite] of cameraState.renderSprites) {
				this.state.container.setTransform(
					camera.transform.position.x,
					camera.transform.position.y,
					camera.transform.scale.x,
					camera.transform.scale.y,
					camera.transform.rotation,
					camera.transform.skew.x,
					camera.transform.skew.y,
					camera.transform.pivot.x,
					camera.transform.pivot.y
				);

				this.state.application.renderer.render(this.state.container, sprite.texture as RenderTexture, true);
			}
		} else {
			this.state.application.renderer.render(this.state.container, this.defaultRenderSprite.texture as RenderTexture, true);
		}

		this.state.application.render();

		// In order for interaction to work
		(this.state.application.renderer as any)._lastObjectRendered = this.state.container;
		this.state.application.renderer.plugins.interaction.update();
	}

	onRemovedFromEngine() {
		this.state.application.stage.removeChild(this.state.container);
	}
}
