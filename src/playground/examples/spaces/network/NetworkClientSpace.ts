import { useQueries } from '@ecs/ecs/helpers';
import Vector3 from '@ecs/math/Vector';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import { ClientBasicWorldSnapshotSystem } from '@ecs/plugins/net/systems/ClientBasicWorldSnapshotSystem';
import ClientConnectionSystem from '@ecs/plugins/net/systems/ClientConnectionSystem';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Boat from '@ecs/plugins/vehicle/components/Boat';
import BoatEntity from '@ecs/plugins/vehicle/entity/BoatEntity';
import { all } from '@ecs/utils/QueryHelper';
import BaseSpace from '../../BaseSpace';
import { deserialize, Snapshot } from './Snapshot';

export class BoatClientWorldSnapshotSystem extends ClientBasicWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = useQueries(this, {
		boats: all(Boat)
	});

	createEntitiesFromSnapshot(snapshot) {}

	applySnapshot(snapshot: Snapshot) {
		const boat = this.snapshotQueries.boats.first;
		const body = boat.get(CannonBody);
		deserialize(body, snapshot.boat);
	}
}

export class NetworkClientSpace extends BaseSpace {
	setup() {
		this.addSystem(new ClientConnectionSystem(this.worldEngine), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ClientPingSystem());
		this.addSystem(new BoatClientWorldSnapshotSystem());
		this.addSystem(new ThirdPersonCameraSystem());
		super.setup();
		const boat = new BoatEntity(this.boatModel, new Vector3(0, 10, 0));
		boat.add(ThirdPersonTarget);
		this.addEntity(boat);
	}
}
