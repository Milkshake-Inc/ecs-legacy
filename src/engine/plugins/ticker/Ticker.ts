import { requestAnimationFrame, cancelAnimationFrame } from './RAF';
import { Signal } from 'typed-signals';

// Taken from https://github.com/IceCreamYou/MainLoop.js/blob/gh-pages/src/mainloop.js
export default class Ticker {
	protected simulationTimeStep = 1000 / 60;
	protected frameDelta = 0;
	protected lastFrameTimeMs = 0;
	protected fps = 60;
	protected fpsAlpha = 0.9;
	protected fpsUpdateInterval = 1000;
	protected lastFpsUpdate = 0;
	protected framesSinceLastFpsUpdate = 0;
	protected numUpdateSteps = 0;
	protected minFrameDelay = 0;
	protected started = false;
	protected panic = false;
	protected rafHandle = null;

	public signalFrameStart: Signal<(dt: number, currentTime: number) => void> = new Signal();
	public signalFixedUpdate: Signal<(dt: number) => void> = new Signal();
	public signalUpdate: Signal<(dt: number) => void> = new Signal();
	public signalLateUpdate: Signal<(dt: number) => void> = new Signal();
	public signalRenderUpdate: Signal<(dt: number) => void> = new Signal();
	public signalFrameEnd: Signal<(fps: number, panic: boolean) => void> = new Signal();

	constructor(public tickRate = 60) {
		this.simulationTimeStep = 1000 / this.tickRate;
	}

	start() {
		if (!this.started) {
			this.started = true;
			this.rafHandle = requestAnimationFrame(dt => {
				// Render the initial state before any updates occur.
				this.signalUpdate.emit(1);

				// Reset variables that are used for tracking time so that we
				// don't simulate time passed while the application was paused.
				this.lastFrameTimeMs = dt;
				this.lastFpsUpdate = dt;
				this.framesSinceLastFpsUpdate = 0;

				// Start the main loop.
				this.rafHandle = requestAnimationFrame(dt => this.tick(dt));
			});
		}
		return this;
	}

	stop() {
		this.started = false;
		if (this.rafHandle) {
			cancelAnimationFrame(this.rafHandle);
		}
	}

	/**
	 * Reset the amount of time that has not yet been simulated to zero.
	 *
	 * This introduces non-deterministic behavior if called after the
	 * application has started running (unless it is being reset, in which case
	 * it doesn't matter). However, this can be useful in cases where the
	 * amount of time that has not yet been simulated has grown very large
	 * (for example, when the application's tab gets put in the background and
	 * the browser throttles the timers as a result). In applications with
	 * lockstep the player would get dropped, but in other networked
	 * applications it may be necessary to snap or ease the player/user to the
	 * authoritative state and discard pending updates in the process. In
	 * non-networked applications it may also be acceptable to simply resume
	 * the application where it last left off and ignore the accumulated
	 * unsimulated time.
	 *
	 * @return {Number}
	 *   The cumulative amount of elapsed time in milliseconds that has not yet
	 *   been simulated, but is being discarded as a result of calling this
	 *   function.
	 */
	resetFrameDelta(): number {
		const oldFrameDelta = this.frameDelta;
		this.frameDelta = 0;
		return oldFrameDelta;
	}

	protected tick(timestamp: number) {
		this.rafHandle = requestAnimationFrame(dt => this.tick(dt));

		if (timestamp < this.lastFrameTimeMs + this.minFrameDelay) {
			return;
		}

		const frameTime = timestamp - this.lastFrameTimeMs;
		this.frameDelta += frameTime;
		this.lastFrameTimeMs = timestamp;

		this.signalFrameStart.emit(this.frameDelta, timestamp);

		if (timestamp > this.lastFpsUpdate + this.fpsUpdateInterval) {
			this.fps =
				(this.fpsAlpha * this.framesSinceLastFpsUpdate * 1000) / (timestamp - this.lastFpsUpdate) + (1 - this.fpsAlpha) * this.fps;

			this.lastFpsUpdate = timestamp;
			this.framesSinceLastFpsUpdate = 0;
		}

		this.framesSinceLastFpsUpdate++;

		this.numUpdateSteps = 0;
		let panic = false;
		while (this.frameDelta >= this.simulationTimeStep) {
			this.signalFixedUpdate.emit(this.simulationTimeStep);
			this.frameDelta -= this.simulationTimeStep;

			if (++this.numUpdateSteps >= 240) {
				panic = true;
				break;
			}
		}

		this.signalUpdate.emit(frameTime);
		this.signalLateUpdate.emit(frameTime);
		this.signalRenderUpdate.emit(frameTime / this.simulationTimeStep);
		this.signalFrameEnd.emit(this.fps, panic);
	}
}
