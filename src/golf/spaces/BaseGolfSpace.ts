import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { Body, Plane } from 'cannon-es';
import { Mesh, MeshPhongMaterial, MeshStandardMaterial } from 'three';
import GolfAssets, { KenneyAssets, MapAssets } from '../constants/GolfAssets';
import { deserializeMap } from '../utils/Serialization';
import CoursePiece from '../components/CoursePiece';
import { FLOOR_BALL_MATERIAL } from '../constants/Physics';
import { loadMap } from '../utils/MapLoader';
import { Maps } from '../constants/Maps';
import { TerrainAnimationSystem } from '../systems/shared/TerrainAnimationSystem';

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

		const loadMaps = Object.keys(MapAssets).map(async key => {
			const gltf = await LoadGLTF(`assets/golf/maps/${MapAssets[key]}`);
			this.golfAssets.maps[key] = gltf;
		});

		await Promise.all([...loadModels, ...loadMaps]);
	}

	setup() {
		this.addSystem(new TerrainAnimationSystem());

		// const mapPieces = deserializeMap(this.golfAssets.gltfs, Maps.DefaultMap);
		const mapPieces = loadMap(this.golfAssets.maps.TRAIN);

		mapPieces.forEach(piece => piece.has(CoursePiece) && piece.get(Transform).position.y++);
		this.addEntities(...mapPieces, this.createGround());
	}

	protected createGround(): Entity {
		const ground = new Entity();
		ground.add(Transform, { rx: -Math.PI / 2, y: -0 });
		ground.add(new Body());
		ground.add(new Plane());
		ground.add(FLOOR_BALL_MATERIAL);
		return ground;
	}
}
