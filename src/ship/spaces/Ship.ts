import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { functionalSystem } from '@ecs/ecs/helpers';
import Color from '@ecs/math/Color';
import Input from '@ecs/plugins/input/components/Input';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Position from '@ecs/plugins/Position';
import Space from '@ecs/plugins/space/Space';
import { all } from '@ecs/utils/QueryHelper';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import {
	BoxGeometry,
	Color as ThreeColor,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	PointLight,
	RepeatWrapping,
	TextureLoader
} from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import SeaWaves from '../components/SeaWaves';
import ThirdPersonTarget from '../components/ThirdPersonTarget';
import WaveMachineSystem, { getWaveHeight } from '../systems/WaveMachineSystem';
import ThirdPersonCameraSystem from '../systems/ThirdPersonCameraSystem';

const ShipSpeed = 0.1;
let Elapsed = 0;

export class Ship extends Space {
	protected shipObject: GLTF;

	constructor(engine: Engine) {
		super(engine, 'ship');
	}

	protected async preload() {
		this.shipObject = await LoadGLTF('assets/prototype/models/boat_large.gltf');
	}

	setup() {
		const camera = new Entity();
		camera.add(Position, { y: 2, z: 5 });
		camera.add(new PointLight(new ThreeColor(Color.White), 2, 10000));
		camera.add(new PerspectiveCamera(75, 1280 / 720, 0.1, 1000));

		const ship = new Entity();
		ship.add(Position, {});
		ship.add(Input);
		ship.add(InputKeybindings.WASD());
		ship.add(this.shipObject.scene.children[0]);
		ship.add(ThirdPersonTarget);

		const floorMaterial = new TextureLoader().load('assets/prototype/textures/blue_texture_03.png');
		floorMaterial.wrapS = RepeatWrapping;
		floorMaterial.wrapT = RepeatWrapping;
		floorMaterial.repeat.set(25, 25);
		const floor = new Entity();
		floor.add(Position);
		floor.add(SeaWaves);
		floor.add(
			new Mesh(
				new BoxGeometry(50, 0.1, 50, 50, 1, 50),
				new MeshBasicMaterial({
					map: floorMaterial,
					wireframe: true
				})
			)
		);

		const cube = new Entity();
		cube.add(Position);
		cube.add(Mesh, {
			geometry: new BoxGeometry(),
			material: new MeshBasicMaterial({ map: new TextureLoader().load('assets/prototype/textures/red/texture_01.png') })
		});

		this.addEntities(camera, ship, floor);

		this.addSystem(new InputSystem());
		this.addSystem(
			functionalSystem([all(Position, Input)], {
				entityUpdate(entity, dt) {
					const pos = entity.get(Position);
					const input = entity.get(Input);

					const directionX = Math.cos(pos.rotation.y + Math.PI / 2) * ShipSpeed;
					const directionY = Math.sin(pos.rotation.y + Math.PI / 2) * ShipSpeed;

					if (input.upDown) {
						pos.z -= directionY;
						pos.x += directionX;
					}
					if (input.downDown) {
						pos.z += directionY;
						pos.x -= directionX;
					}

					if (input.leftDown) {
						pos.rotation.y += 0.02;
					}

					if (input.rightDown) {
						pos.rotation.y -= 0.02;
					}

					Elapsed += dt;

					pos.y = getWaveHeight(pos.x, pos.z, Elapsed);
				}
			})
		);

		this.addSystem(new WaveMachineSystem());
		this.addSystem(new ThirdPersonCameraSystem());
	}
}
