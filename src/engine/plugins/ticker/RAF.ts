/* eslint-disable no-mixed-spaces-and-tabs */
import { PlatformHelper } from '@ecs/utils/Platform';

export const requestAnimationFrame = PlatformHelper.IsClient()
	? window.requestAnimationFrame.bind(window)
	: (() => {
			let lastTimestamp = performance.now(),
				now: number,
				timeout: number;
			return callback => {
				now = performance.now();
				timeout = Math.max(0, 1000 / 60 - (now - lastTimestamp));
				lastTimestamp = now + timeout;
				return setTimeout(() => {
					callback(now + timeout);
				}, timeout);
			};
	  })();

export const cancelAnimationFrame: (handle: number) => void = PlatformHelper.IsClient()
	? window.cancelAnimationFrame.bind(window)
	: clearTimeout;
