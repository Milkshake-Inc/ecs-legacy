import TickerEngine from '@ecs/TickerEngine';
import { performance } from 'perf_hooks';

class PlaygroundEngine extends TickerEngine {
	constructor() {
		super(60);
	}

	protected getTime(): number {
		return performance.now();
	}

	public update(deltaTsime: number) {}
}

new PlaygroundEngine();
