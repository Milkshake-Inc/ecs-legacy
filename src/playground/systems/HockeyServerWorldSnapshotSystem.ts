import { generateSnapshotQueries, Snapshot, takeSnapshot } from '../spaces/Hockey';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';

export class HockeyServerWorldSnapshotSystem extends ServerWorldSnapshotSystem<Snapshot, typeof generateSnapshotQueries> {
	constructor() {
		super(generateSnapshotQueries)
	}

	generateSnapshot(): Snapshot {
		return takeSnapshot(this.queries)
	}
}