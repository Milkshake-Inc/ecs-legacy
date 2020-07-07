import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { Body, Plane } from 'cannon-es';
import { Mesh, MeshPhongMaterial, MeshStandardMaterial } from 'three';
import GolfAssets, { KenneyAssets } from '../constants/GolfAssets';
import { deserializeMap } from '../utils/Serialization';
import { Maps } from '../constants/Maps';
import CoursePiece from '../components/CoursePiece';

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

		const mapPieces = deserializeMap(this.golfAssets.gltfs, Maps.DefaultMap);

		mapPieces.forEach(piece => piece.has(CoursePiece) && piece.get(Transform).position.y++);

		this.addEntities(...mapPieces);
	}

	protected createGround(): Entity {
		const ground = new Entity();
		ground.add(Transform, { rx: -Math.PI / 2, y: -0 });
		ground.add(new Body());
		ground.add(new Plane());
		return ground;
	}
}
