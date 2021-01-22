import { Engine } from 'tick-knock';
import Ticker from '@ecs/plugins/ticker/Ticker';
import { useState } from './helpers';

export class TickerEngineStatistics {
	frameTime: number;
}

export default class TickerEngine extends Engine {
	protected tickRate: number;
	protected ticker: Ticker;

	statistics = useState(this, new TickerEngineStatistics(), {
		frameTime: -1
	});

	constructor(tickRate = 60) {
		super();
		this.tickRate = tickRate;

		this.ticker = new Ticker(tickRate);
		this.ticker.signalFixedUpdate.connect(dt => this.updateFixed(dt));
		this.ticker.signalUpdate.connect((dt, frameDelta) => this.update(dt, frameDelta));
		this.ticker.signalLateUpdate.connect(dt => this.updateLate(dt));
		this.ticker.signalFrameEnd.connect((dt, panic) => {
			if (panic) {
				const oldFrameDelta = this.ticker.resetFrameDelta();
				console.log(
					`🚨  Ticker Panic - Ticker delta was ${Math.floor(oldFrameDelta)}ms Resetting frame delta in ticker. May cause chaos.`
				);
			}
		});
		this.ticker.start();

		this.ticker.signalFrameEnd.connect(deltaTime => {
			this.statistics.frameTime = this.ticker.frameTime;
		});
	}
}
