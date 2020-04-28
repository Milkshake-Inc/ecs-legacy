import { Engine } from '@ecs/ecs/Engine';
import Space from '@ecs/plugins/space/Space';
import { Entity } from '@ecs/ecs/Entity';
import { BoxGeometry, MeshBasicMaterial, Mesh, TextureLoader, PerspectiveCamera, Color as ThreeColor, PointLight } from 'three';

import Position from '@ecs/plugins/Position';
import { functionalSystem } from '@ecs/ecs/helpers';
import { all } from '@ecs/utils/QueryHelper';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import Color from '@ecs/math/Color';
import Input from '@ecs/plugins/input/components/Input';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';

const ShipSpeed = 0.01;
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
		camera.add(new PointLight(new ThreeColor(Color.White), 1, 100));
		camera.add(new PerspectiveCamera(75, 1280 / 720, 0.1, 1000));

		const ship = new Entity();
		ship.add(Position, {});
		ship.add(Input);
		ship.add(InputKeybindings.WASD());
		ship.add(this.shipObject.scene.children[0]);

		const sea = new Entity();
		sea.add(Position);
		sea.add(Mesh, {
			geometry: new BoxGeometry(5, 0.1, 5),
			material: new MeshBasicMaterial({
				color: new ThreeColor(0x0000ff)
			})
		});

		const cube = new Entity();
		cube.add(Position);
		cube.add(Mesh, {
			geometry: new BoxGeometry(),
			material: new MeshBasicMaterial({ map: new TextureLoader().load('assets/prototype/textures/red/texture_01.png') })
		});
		this.addEntities(camera, ship, sea);

		this.addSystem(new InputSystem());
		this.addSystem(
			functionalSystem([all(Position, Input)], {
				entityUpdate(entity, dt) {
					const pos = entity.get(Position);
					const input = entity.get(Input);

					const directionX = Math.cos(pos.r + Math.PI / 2) * ShipSpeed;
					const directionY = Math.sin(pos.r + Math.PI / 2) * ShipSpeed;

					if (input.upDown) {
						pos.z -= directionY;
						pos.x += directionX;
					}
					if (input.downDown) {
						pos.z += directionY;
						pos.x -= directionX;
					}

					if (input.leftDown) {
						pos.r += ShipSpeed;
					}

					if (input.rightDown) {
						pos.r -= ShipSpeed;
					}

					Elapsed += dt;

					pos.y = Math.sin(Elapsed / 1000) * 0.1;
				}
			})
		);
	}
}
