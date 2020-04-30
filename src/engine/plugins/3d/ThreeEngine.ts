import RenderSystem from './systems/RenderSystem';
import TickerEngine from '@ecs/TickerEngine';
import Space from '../space/Space';

export class ThreeEngine extends TickerEngine {
	protected spaces: Map<string, Space>;

	constructor(customRendererSystem?: RenderSystem, tickRate = 60) {
		super(tickRate);

		this.addSystem(customRendererSystem ? customRendererSystem : new RenderSystem());

		this.spaces = new Map();
	}

	public getSpace(spaceName: string) {
		return this.spaces.get(spaceName);
	}

	public registerSpaces(...spaces: Space[]) {
		spaces.forEach(v => this.spaces.set(v.name, v));
	}

	protected getTime(): number {
		return performance.now();
	}

	protected buildCallback(callback: () => void) {
		const handleAnimationFrame = () => {
			callback();
			requestAnimationFrame(handleAnimationFrame);
		};

		requestAnimationFrame(handleAnimationFrame);
	}
}
