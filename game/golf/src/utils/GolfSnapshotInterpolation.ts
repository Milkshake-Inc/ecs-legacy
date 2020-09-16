import { SnapshotInterpolation } from '@geckos.io/snapshot-interpolation';
import { Snapshot, InterpolatedSnapshot, Time, State, Entity, Value } from '@geckos.io/snapshot-interpolation/lib/types';

export const lerp = (start: number, end: number, t: number) => {
	return start + (end - start) * t;
};

export default class GolfSnapshotInterpolation extends SnapshotInterpolation {
	constructor(serverFPS: number) {
		super(serverFPS);

		(this as any)._interpolate = this._interpolateRevamp;
	}

	private _interpolateRevamp(
		snapshotA: Snapshot,
		snapshotB: Snapshot,
		timeOrPercentage: number,
		parameters: string,
		deep: string
	): InterpolatedSnapshot {
		const sorted = [snapshotA, snapshotB].sort((a, b) => b.time - a.time);
		parameters.trim().replace(/\W+/, ' ').split(' ');

		const newer: Snapshot = sorted[0];
		const older: Snapshot = sorted[1];

		const t0: Time = newer.time;
		const t1: Time = older.time;
		/**
		 * If <= it is in percentage
		 * else it is the server time
		 */
		const tn: number = timeOrPercentage; // serverTime is between t0 and t1

		// THE TIMELINE
		// t = time (serverTime)
		// p = entity position
		// ------ t1 ------ tn --- t0 ----->> NOW
		// ------ p1 ------ pn --- p0 ----->> NOW
		// ------ 0% ------ x% --- 100% --->> NOW
		const zeroPercent = tn - t1;
		const hundredPercent = t0 - t1;
		const pPercent = timeOrPercentage <= 1 ? timeOrPercentage : zeroPercent / hundredPercent;

		this.serverTime = lerp(t1, t0, pPercent);

		const lerpFnc = (method: string, start: Value, end: Value, t: number) => {
			if (typeof start === 'undefined' || typeof end === 'undefined') return;

			if (typeof start === 'string' || typeof end === 'string') throw new Error(`Can't interpolate string!`);

			if (typeof start === 'number' && typeof end === 'number') {
				if (method === 'linear') return lerp(start, end, t);
			}

			throw new Error(`No lerp method "${method}" found!`);
		};

		if (!Array.isArray(newer.state) && deep === '') throw new Error('You forgot to add the "deep" parameter.');

		if (Array.isArray(newer.state) && deep !== '') throw new Error('No "deep" needed it state is an array.');

		const newerState: State = Array.isArray(newer.state) ? newer.state : newer.state[deep];
		const olderState: State = Array.isArray(older.state) ? older.state : older.state[deep];

		const tmpSnapshot: Snapshot = JSON.parse(JSON.stringify({ ...newer, state: newerState }));

		newerState.forEach((newEntity: Entity, i: number) => {
			const id = newEntity.id;
			const oldEntity: Entity | undefined = olderState.find((e: any) => e.id === id);

			if (!oldEntity) return;

			const result = tmpSnapshot.state[i];

			const recursive = (resultEntity: {}, fromEntity: {}, toEntity: {}, percent) => {
				for (const key in toEntity) {
					if (typeof fromEntity[key] === 'number' && typeof toEntity[key] === 'number') {
						if (fromEntity[key]) {
							// Lerp
							resultEntity[key] = lerpFnc('linear', fromEntity[key], toEntity[key], pPercent);
						} else {
							resultEntity[key] = toEntity[key];
						}
					}

					if (typeof fromEntity[key] === 'object') {
						recursive(resultEntity[key], fromEntity[key], toEntity[key], pPercent);
					}
				}
			};

			recursive(result, oldEntity, newEntity, pPercent);
		});

		const interpolatedSnapshot: InterpolatedSnapshot = {
			state: tmpSnapshot.state as State,
			percentage: pPercent,
			newer: newer.id,
			older: older.id
		};

		return interpolatedSnapshot;
	}
}
