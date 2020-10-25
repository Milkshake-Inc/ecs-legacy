import { System } from '../System';

export const useTimer = (system: System, callback: () => void, timeMs: number) => {
	let totalElapsed = 0;
	let elapsedClock = 0;

	const update = (deltaTime: number) => {
		elapsedClock += deltaTime;
		totalElapsed += deltaTime;

		if (elapsedClock >= timeMs) {
			elapsedClock -= timeMs;
			callback();
		}
	};

	system.signalBeforeUpdate.connect(update);

	return {
		totalElapsed,
		cleanup: () => {
			system.signalBeforeUpdate.disconnect(update);
		}
	};
};
