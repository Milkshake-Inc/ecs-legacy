import BaseSpace from '../../BaseSpace';
import BoatEntity from '@ecs/plugins/vehicle/entity/BoatEntity';
import Vector3 from '@ecs/math/Vector';
import { functionalSystem } from '@ecs/ecs/helpers';
import { all } from '@ecs/utils/QueryHelper';
import Boat from '@ecs/plugins/vehicle/components/Boat';
import { Transform } from 'pixi.js';

export class NetworkClientSpace extends BaseSpace {
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
