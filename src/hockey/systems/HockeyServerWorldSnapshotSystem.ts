import { useQueriesManual } from '@ecs/ecs/helpers';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import { generateSnapshotQueries, Snapshot, takeSnapshot } from '../spaces/Hockey';

export class HockeyServerWorldSnapshotSystem extends ServerWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = useQueriesManual(this, generateSnapshotQueries);

	constructor() {
		super();
	}

	generateSnapshot(): Snapshot {
		return takeSnapshot(this.snapshotQueries);
	}
}
