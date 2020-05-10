// import Space from '@ecs/plugins/space/Space';
import BaseSpace from '../../BaseSpace';
import Vector3 from '@ecs/math/Vector';
import BoatEntity from '@ecs/plugins/vehicle/entity/BoatEntity';
import Boat from '@ecs/plugins/vehicle/components/Boat';
import { all } from '@ecs/utils/QueryHelper';
import { functionalSystem } from '@ecs/ecs/helpers';
import Transform from '@ecs/plugins/Transform';

export class NetworkServerSpace extends BaseSpace {
	setup() {
		super.setup();

		const boat = new BoatEntity(this.boatModel, new Vector3(0, 10, 0));
		this.addEntity(boat);

		this.addSystem(
			functionalSystem([all(Boat)], {
				entityUpdateFixed: (entity, dt) => {
					console.log(entity.get(Transform).position.y);
				}
			})
		);
	}
}
