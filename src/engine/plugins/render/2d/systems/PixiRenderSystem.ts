import { useQueries, useState } from '@ecs/core/helpers';
import { System, all } from 'tick-knock';
import CameraRenderState from '@ecs/plugins/render/2d/components/CameraRenderState';
import { Application, Container, RenderTexture, Sprite as PixiSprite, Graphics, spine } from 'pixi.js';
import PixiRenderState from '../components/RenderState';
import { useParticleCouple } from '../couples/ParticleCouple';
import { useSpineCouple } from '../couples/SpineCouple';
import Color from '@ecs/plugins/math/Color';
import { usePixiCouple } from '../couples/PixiCouple';
import { useDisplayObjectsCouple } from '../couples/useDisplayObjectsCouple';

export type RenderSystemSettings = {
	width: number;
	height: number;
	clearColor: number;
	transparent: boolean;
	addCanvas: boolean;
	uiZIndex: number;
};

export const DefaultRenderSystemSettings: RenderSystemSettings = {
	width: 1280,
	height: 720,
	clearColor: Color.Tomato,
	addCanvas: true,
	transparent: false,
	uiZIndex: 10
};

// customCouples?: (system: RenderSystem) => ReturnType<typeof useThreeCouple>[]
export default class PixiRenderSystem extends System {
	protected state = useState(this, new PixiRenderState());

	protected queries = useQueries(this, {
		cameraState: all(CameraRenderState)
	});

	protected defaultRenderSprite: PixiSprite;

	// Query passed in must be added to engine.... & update has to be called manually
	// Maybe you could have TileMapCouplerPlugin - which renders tilemap (ParticleContainer etc)
	// new RenderSystem([ useTileMapCouple ])
	protected couples = [useDisplayObjectsCouple(this), useParticleCouple(this), useSpineCouple(this)];

	constructor(
		customSettings?: Partial<RenderSystemSettings>,
		customCouples?: (system: PixiRenderSystem) => ReturnType<typeof usePixiCouple>[]
	) {
		super();

		const settings = {
			...DefaultRenderSystemSettings,
			...customSettings
		};

		if (customCouples) {
			this.couples.push(...(customCouples(this) as any));
		}

		this.state.container = new Container();
		this.state.ui = new Container();
		this.state.ui.zIndex = settings.uiZIndex;

		this.state.container.addChild(this.state.ui);

		this.state.application = new Application({
			view: <HTMLCanvasElement>document.getElementById('canvas'),
			width: settings.width,
			height: settings.height,
			transparent: settings.transparent,
			backgroundColor: settings.clearColor,
			antialias: true,
			resolution: devicePixelRatio,
			autoDensity: true,
			autoStart: false
		});

		(window as any).renderSystem = this;

		this.state.application.stage.addChild(
			(this.defaultRenderSprite = new PixiSprite(RenderTexture.create({ width: settings.width, height: settings.height })))
		);

		this.state.container.sortableChildren = true;

		// Interaction styff
		this.state.application.renderer.plugins.interaction.useSystemTicker = false;
		this.state.container.interactive = true;
		this.state.container.interactiveChildren = true;

		if (settings.addCanvas) {
			document.body.appendChild(this.state.application.view);
		}
	}

	update(dt: number) {
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

				this.state.ui.position.set(-camera.transform.position.x - 1280 / 2, -camera.transform.position.y - 720 / 2);

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
