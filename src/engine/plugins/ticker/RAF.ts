/* eslint-disable no-mixed-spaces-and-tabs */
import { PlatformHelper } from '@ecs/utils/Platform';

const windowOrGlobal: any = typeof window === 'object' ? window : global;

export const requestAnimationFrame = PlatformHelper.IsClient()
	? window.requestAnimationFrame.bind(window)
	: (() => {
			let lastTimestamp = Date.now(),
				now,
				timeout;
			return callback => {
				now = Date.now();
				timeout = Math.max(0, 1000 / 60 - (now - lastTimestamp));
				lastTimestamp = now + timeout;
				return setTimeout(function () {
					callback(now + timeout);
				}, timeout);
			};
	  })();

export const cancelAnimationFrame: (handle: number) => void = windowOrGlobal.cancelAnimationFrame || clearTimeout;
