import Vector3 from '@ecs/math/Vector';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import CharacterEntity from '@ecs/plugins/character/entity/CharacterEntity';
import CharacterAnimateSystem from '@ecs/plugins/character/systems/CharacterAnimateSystem';
import CharacterControllerSystem from '@ecs/plugins/character/systems/CharacterControllerSystem';
import Input from '@ecs/plugins/input/components/Input';
import ClientConnectionSystem from '@ecs/plugins/net/systems/ClientConnectionSystem';
import ClientInputSenderSystem from '@ecs/plugins/net/systems/ClientInputSenderSystem';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';
import BoatEntity from '@ecs/plugins/vehicle/entity/BoatEntity';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import BaseSpace from '../../BaseSpace';
import { PlayerSpawnSystem } from './Shared';
import ClientSnapshotSystem from './systems/ClientSnapshotSystem';
import { CharacterInputSystem } from '@ecs/plugins/character/systems/CharacterInputSystem';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';

export class NetworkClientSpace extends BaseSpace {
	protected boxModel: GLTF;
	protected heliModel: GLTF;

	protected async preload() {
		await super.preload();

		this.boxModel = await LoadGLTF('assets/prototype/models/boxman.glb');
		this.heliModel = await LoadGLTF('assets/prototype/models/heli.glb');
	}

	setup() {
		this.addSystem(new ClientConnectionSystem(this.worldEngine), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ClientPingSystem());

		this.addSystem(new ThirdPersonCameraSystem());

		this.addSystem(new CharacterInputSystem());

		this.addSystem(new ClientInputSenderSystem());
		this.addSystem(new CharacterControllerSystem());
		this.addSystem(new CharacterAnimateSystem());

		// this.addSystem(new HelicopterControllerSystem());

		super.setup();

		this.addSystem(
			new PlayerSpawnSystem((entity, local) => {
				const player = new CharacterEntity(this.boxModel);

				player.components.forEach(c => {
					entity.add(c);
				});
				if (local) {
					entity.add(Input);
					entity.add(InputKeybindings.WASD());
				}

				entity.add(ThirdPersonTarget);
			})
		);

		const boat = new BoatEntity(this.boatModel, new Vector3(0, 10, 0));
		this.addEntity(boat);

		// const helicopter = new HelicopterEntity(this.heliModel, new Vector3(0, 1, 10));
		// helicopter.add(Input);
		// helicopter.get(Vehicle).controller = boat;
		// this.addEntity(helicopter);

		// setInterval(() => {
		// 	console.log(helicopter.get(Transform).position);
		// }, 1000);

		this.addSystem(new ClientSnapshotSystem(this.worldEngine));
	}
}
