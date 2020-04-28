import { Engine } from '@ecs/ecs/Engine';
import Space from '@ecs/plugins/space/Space';
import { Entity } from '@ecs/ecs/Entity';
import { BoxGeometry, MeshBasicMaterial, Mesh, TextureLoader, PerspectiveCamera } from 'three';

import Position from '@ecs/plugins/Position';
import { functionalSystem } from '@ecs/ecs/helpers';
import { all } from '@ecs/utils/QueryHelper';

export class Ship extends Space {
	constructor(engine: Engine) {
		super(engine, 'ship');
	}

	setup() {
		const camera = new Entity();
		camera.add(Position, { z: 1.5 });
		camera.add(new PerspectiveCamera(75, 1280 / 720, 0.1, 1000));

		const cube = new Entity();
		cube.add(Position);
		cube.add(BoxGeometry);
		cube.add(MeshBasicMaterial, { map: new TextureLoader().load('assets/prototype/textures/red/texture_01.png') });
		cube.add(Mesh);
		this.addEntities(cube, camera);

		this.addSystem(
			functionalSystem([all(Position, Mesh)], {
				entityUpdate(entity, dt) {
					const pos = entity.get(Position);
					pos.r += 0.01;
				}
			})
		);
	}
}
