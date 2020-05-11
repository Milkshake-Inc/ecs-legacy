import Vector3 from '@ecs/math/Vector';
import { BaseCharacterEntity } from '@ecs/plugins/character/entity/CharacterEntity';
import CharacterControllerSystem from '@ecs/plugins/character/systems/CharacterControllerSystem';
import Input from '@ecs/plugins/input/components/Input';
import { InputHistory } from '@ecs/plugins/input/components/InputHistory';
import Session from '@ecs/plugins/net/components/Session';
import { ServerAddInputToHistory } from '@ecs/plugins/net/systems/ServerAddInputToHistory';
import { ServerApplyInputFromHistory } from '@ecs/plugins/net/systems/ServerApplyInputFromHistory';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import BoatEntity from '@ecs/plugins/vehicle/entity/BoatEntity';
import { Vec3 } from 'cannon-es';
import BaseSpace from '../../BaseSpace';
import { PlayerSpawnSystem } from './Shared';
import ServerSnapshotSystem from './systems/ServerSnapshotSystem';

export class NetworkServerSpace extends BaseSpace {
	setup() {
		this.addSystem(new ServerAddInputToHistory());
		this.addSystem(new ServerApplyInputFromHistory());

		super.setup();

		this.addSystem(new CharacterControllerSystem());

		const boat = new BoatEntity(this.boatModel, new Vector3(0, 10, 0));
		this.addEntity(boat);

		setInterval(() => {
			boat.get(CannonBody).applyImpulse(new Vec3(0, 80, 0), new Vec3(0, 0, 0));
		}, 1000);

		this.addSystem(
			new PlayerSpawnSystem(entity => {
				const player = new BaseCharacterEntity();

				player.components.forEach(c => {
					entity.add(c);
				});
				entity.add(Input);
				entity.add(InputHistory);

				console.log('Created player ' + entity.get(Session).id);
			})
		);

		this.addSystem(new ServerSnapshotSystem());
	}
}
