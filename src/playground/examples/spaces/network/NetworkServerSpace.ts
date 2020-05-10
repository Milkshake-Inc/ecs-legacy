// import Space from '@ecs/plugins/space/Space';
import { functionalSystem, useQueries } from '@ecs/ecs/helpers';
import Vector3 from '@ecs/math/Vector';
import { ServerWorldSnapshotSystem } from '@ecs/plugins/net/systems/ServerWorldSnapshotSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Boat from '@ecs/plugins/vehicle/components/Boat';
import BoatEntity from '@ecs/plugins/vehicle/entity/BoatEntity';
import { all } from '@ecs/utils/QueryHelper';
import { Vec3 } from 'cannon-es';
import BaseSpace from '../../BaseSpace';
import { serialize, Snapshot } from './Snapshot';

export class BoatServerWorldSnapshotSystem extends ServerWorldSnapshotSystem<Snapshot> {
	protected snapshotQueries = useQueries(this, {
		boats: all(Boat),
	})

	generateSnapshot(): Snapshot {
		const boat = this.snapshotQueries.boats.first;
		const body = boat.get(CannonBody);

		return {
			boat: serialize(body),
		}
	}
}

export class NetworkServerSpace extends BaseSpace {
	setup() {
		super.setup();


		this.addSystem(new BoatServerWorldSnapshotSystem());


		const boat = new BoatEntity(this.boatModel, new Vector3(0, 10, 0));
		this.addEntity(boat);

		setInterval(() => {
			boat.get(CannonBody).applyImpulse(new Vec3(4, 80, 0), new Vec3(0, 0, 0));
		}, 1000);

		this.addSystem(
			functionalSystem([all(Boat)], {
				entityUpdateFixed: (entity, dt) => {
					// console.log(entity.get(Transform).position.y);
				}
			})
		);
	}
}
