import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Transform from '@ecs/plugins/math/Transform';
import AmmoBody from '@ecs/plugins/physics/ammo/components/AmmoBody';
import AmmoPlane from '@ecs/plugins/physics/ammo/components/AmmoPlane';
import Space from '@ecs/plugins/space/Space';
import { LoadGLTF } from '@ecs/plugins/tools/ThreeHelper';
import { Mesh, MeshPhongMaterial, MeshStandardMaterial } from 'three';
import GolfAssets, { KenneyAssets, MapAssets } from '../constants/GolfAssets';
import { loadMap } from '../utils/MapLoader';
import Ground from '../components/Ground';
import AmmoShape from '@ecs/plugins/physics/ammo/components/AmmoShape';

export default class BaseGolfSpace extends Space {
	protected golfAssets: GolfAssets;
	protected isServer: boolean;

	constructor(engine: Engine, open = false, isServer = false) {
		super(engine, open);

		this.isServer = isServer;

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
		// const mapPieces = deserializeMap(this.golfAssets.gltfs, Maps.DefaultMap);
		const mapPieces = loadMap(this.golfAssets.maps.TRAIN, this.isServer);

		// mapPieces.forEach(piece => piece.has(CoursePiece) && piece.get(Transform).position.y++);
		this.addEntities(...mapPieces, this.createGround());
	}

	protected createGround(): Entity {
		const ground = new Entity();

		// TODO
		// This is a bit weird, as client needs the plane rotated visually
		// ThreeJS plane vs AmmoShape.BOX are misaligned
		if(this.isServer) {
			ground.add(Transform, { y: -0.5 });
		} else {
			ground.add(Transform, { rx: -Math.PI / 2, y: 0 });
		}
		ground.add(Ground)

		if(this.isServer) {
			ground.add(AmmoBody, {
				mass: 0
			});
			ground.add(AmmoShape.BOX({
				x: 100,
				y: 0.5,
				z: 100
			}))
		}

		return ground;
	}
}
