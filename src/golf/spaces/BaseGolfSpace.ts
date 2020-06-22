import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Vector3 from '@ecs/math/Vector';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { Body, Plane, Sphere } from 'cannon-es';
import { Mesh, MeshPhongMaterial, MeshStandardMaterial } from 'three';
import { KenneyAssets } from '../constants/Assets';
import GolfAssets from '../components/GolfAssets';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { FLOOR_MATERIAL } from '../constants/Materials';

export default class BaseGolfSpace extends Space {
	protected golfAssets: GolfAssets;

	constructor(engine: Engine, open = false) {
		super(engine, open);

		const kenneyAssetsEntity = new Entity();
		kenneyAssetsEntity.add((this.golfAssets = new GolfAssets()));
		engine.addEntity(kenneyAssetsEntity);
	}

	protected async preload() {
		const loadModels = Object.keys(KenneyAssets).map(async key => {
			const gltf = await LoadGLTF(`assets/golf/${KenneyAssets[key]}`);

			// Proccess mesh to nicer material - Not needed on server
			gltf.scene.traverse(child => {
				if (child instanceof Mesh) {
					const color = (child.material as MeshStandardMaterial).color;
					child.material = new MeshPhongMaterial({
						color
					});
					child.castShadow = true;
				}
			});

			this.golfAssets.gltfs[key] = gltf;
		});

		await Promise.all(loadModels);
	}

	setup() {
		// this.addSystem(new CannonPhysicsSystem(new Vector3(0, -5, 0), 10, false, 3));

		const ground = this.createGround();

		this.addEntities(ground);
	}

	protected createGround(): Entity {
		const ground = new Entity();
		ground.add(Transform, { rx: -Math.PI / 2, y: -0 });
		ground.add(new Body());
		ground.add(new Plane());
		return ground;
	}

	protected createBall(position?: Vector3): Entity {
		const entity = new Entity();
		entity.add(Transform, { position: position ? position : Vector3.ZERO });
		entity.add(
			new CannonBody({
				mass: 1,
				material: FLOOR_MATERIAL
			})
		);
		entity.add(new Sphere(0.04));

		return entity;
	}
}
