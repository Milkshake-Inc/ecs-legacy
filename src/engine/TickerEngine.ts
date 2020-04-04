import { Engine } from './ecs/Engine';

export default abstract class TickerEngine extends Engine {
	protected timeMultiplier = 1;

	protected tickRate: number;
	protected updateRate: number;

	protected tickRateMs: number;
	protected updateRateMs: number;

	protected currentTime: number;
	protected accumulator: number;

	constructor(tickRate: number, updateRate: number = tickRate) {
		super();

		this.tickRate = tickRate;
		this.updateRate = updateRate;

		this.tickRateMs = 1000 / tickRate;
		this.updateRateMs = 1000 / updateRate;

		this.currentTime = this.getTime();
		this.accumulator = 0;

		this.buildCallback(this.intervalCalled.bind(this));
	}

	protected buildCallback(callback: () => void) {
		setInterval(() => {
			callback();
		}, this.updateRateMs);
	}

	private intervalCalled(): void {
		const newTime = this.getTime();
		const frameTime = newTime - this.currentTime;

		this.accumulator += frameTime * this.timeMultiplier;

		// If client need to catch up more than 1min, skip updateFixed while loop
		if (this.accumulator > 1000 * 60) {
			this.accumulator = this.tickRateMs;
			console.log('⚠ Client has over 1min of frames to catch up. Skipping `updateFixed`');
		}

		while (this.accumulator >= this.tickRateMs) {
			this.updateFixed(this.tickRateMs);
			this.accumulator -= this.tickRateMs;
		}

		this.update(frameTime);

		this.currentTime = newTime;
	}

	protected abstract getTime(): number;
}
