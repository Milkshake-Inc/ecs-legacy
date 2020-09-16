import { Engine } from '@ecs/core/Engine';
import { Entity } from '@ecs/core/Entity';
import Transform from '@ecs/plugins/math/Transform';
import AmmoBody from '@ecs/plugins/physics/ammo/components/AmmoBody';
import AmmoShape from '@ecs/plugins/physics/ammo/components/AmmoShape';
import Space from '@ecs/plugins/space/Space';
import { LoadGLTF } from '@ecs/plugins/tools/ThreeHelper';
import Ground from '../components/Ground';
import GolfAssets, { MapAssets, Maps } from '../constants/GolfAssets';
import { loadMap } from '../utils/MapLoader';
import { PlatformHelper } from '@ecs/plugins/tools/Platform';

export default class BaseGolfSpace extends Space {
	protected golfAssets: GolfAssets;
	protected mapEntities: Entity[];

	constructor(engine: Engine, open = false) {
		super(engine, open);

		const kenneyAssetsEntity = new Entity();
		kenneyAssetsEntity.add((this.golfAssets = new GolfAssets()));
		engine.addEntity(kenneyAssetsEntity);
	}

	protected async preload() {
		const loadMaps = Object.keys(MapAssets).map(async key => {
			const gltf = await LoadGLTF(`assets/golf/maps/${MapAssets[key]}`);
			this.golfAssets.maps[key] = gltf;
		});

		await Promise.all([...loadMaps]);
	}

	setup() {
		this.switchMap('CITY');
		this.addEntities(this.createGround());
	}

	clear() {
		super.clear();

		this.golfAssets.maps = null;
		this.mapEntities = null;
	}

	switchMap(map: Maps) {
		if (this.mapEntities) {
			this.removeEntities(...this.mapEntities);
		}

		this.mapEntities = loadMap(this.golfAssets.maps[map]);
		this.addEntities(...this.mapEntities);
	}

	protected createGround(): Entity {
		const ground = new Entity();

		// TODO
		// This is a bit weird, as client needs the plane rotated visually
		// ThreeJS plane vs AmmoShape.BOX are misaligned
		if (PlatformHelper.IsServer) {
			ground.add(Transform, { y: -0.5 });
			ground.add(AmmoBody, {
				mass: 0
			});
			ground.add(
				AmmoShape.BOX({
					x: 100,
					y: 0.5,
					z: 100
				})
			);
		} else {
			ground.add(Transform, { rx: -Math.PI / 2, y: 0 });
		}

		ground.add(Ground);
		return ground;
	}
}
