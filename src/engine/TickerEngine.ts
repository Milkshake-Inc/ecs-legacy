import { Engine } from './ecs/Engine';
import Ticker from './plugins/ticker/Ticker';

export default abstract class TickerEngine extends Engine {
	protected tickRate: number;
	protected ticker: Ticker;

	constructor(tickRate = 60) {
		super();

		this.tickRate = tickRate;

		this.ticker = new Ticker(tickRate);
		this.ticker.signalFixedUpdate.connect(dt => this.updateFixed(dt));
		this.ticker.signalUpdate.connect(dt => this.update(dt));
		this.ticker.signalLateUpdate.connect(dt => this.updateLate(dt));
		this.ticker.signalRenderUpdate.connect(dt => this.updateRender(dt));
		this.ticker.signalFrameEnd.connect((dt, panic) => {
			if (panic) {
				const oldFrameDelta = this.ticker.resetFrameDelta();
				console.log(`⚠Ticker Panic⚠ - Ticker delta was ${oldFrameDelta} Resetting frame delta in ticker. May cause chaos.`);
			}
		});
		this.ticker.start();
	}
}
