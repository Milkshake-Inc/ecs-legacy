import RenderSystem from './systems/RenderSystem';
import TickerEngine from '@ecs/core/TickerEngine';

export class ThreeEngine extends TickerEngine {
	constructor(customRendererSystem?: RenderSystem, tickRate = 60) {
		super(tickRate);

		this.addSystem(customRendererSystem ? customRendererSystem : new RenderSystem(), 1000);
	}
}
