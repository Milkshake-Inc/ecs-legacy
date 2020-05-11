import Vector3 from '@ecs/math/Vector';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import CharacterEntity from '@ecs/plugins/character/entity/CharacterEntity';
import CharacterAnimateSystem from '@ecs/plugins/character/systems/CharacterAnimateSystem';
import CharacterControllerSystem from '@ecs/plugins/character/systems/CharacterControllerSystem';
import Input from '@ecs/plugins/input/components/Input';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import ClientConnectionSystem from '@ecs/plugins/net/systems/ClientConnectionSystem';
import ClientInputSenderSystem from '@ecs/plugins/net/systems/ClientInputSenderSystem';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';
import BoatEntity from '@ecs/plugins/vehicle/entity/BoatEntity';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import BaseSpace from '../../BaseSpace';
import { PlayerSpawnSystem } from './Shared';
import ClientSnapshotSystem from './systems/ClientSnapshotSystem';

export class NetworkClientSpace extends BaseSpace {
	protected boxModel: GLTF;

	protected async preload() {
		await super.preload();

		this.boxModel = await LoadGLTF('assets/prototype/models/boxman.glb');
	}

	setup() {
		this.addSystem(new ClientConnectionSystem(this.worldEngine), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ClientPingSystem());

		this.addSystem(new ThirdPersonCameraSystem());

		this.addSystem(new InputSystem());
		this.addSystem(new ClientInputSenderSystem());

		this.addSystem(new CharacterControllerSystem());
		this.addSystem(new CharacterAnimateSystem());

		super.setup();

		this.addSystem(
			new PlayerSpawnSystem((entity, local) => {
				const player = new CharacterEntity(this.boxModel);

				player.components.forEach(c => {
					entity.add(c);
				});
				if (local) {
					entity.add(Input);
				}

				entity.add(ThirdPersonTarget);
			})
		);

		const boat = new BoatEntity(this.boatModel, new Vector3(0, 10, 0));
		this.addEntity(boat);

		this.addSystem(new ClientSnapshotSystem(this.worldEngine));
	}
}
