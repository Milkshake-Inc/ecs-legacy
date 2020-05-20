import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Vector3 from '@ecs/math/Vector';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { Body, Plane } from 'cannon-es';
import { Mesh, MeshPhongMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { KenneyAssets } from '../constants/Assets';

type AssetsMap<T, K> = {
	[P in keyof T]: K;
};

export type KenneyAssetsGLTF = Partial<AssetsMap<typeof KenneyAssets, GLTF>>;

export default class BaseGolfSpace extends Space {

	protected kenneyAssets: KenneyAssetsGLTF = {};

	constructor(engine: Engine, open = false) {
		super(engine, open);
	}

	protected async preload() {
		const loadModels = Object.keys(KenneyAssets).map(async key => {
			const gltf = await LoadGLTF('assets/golf/' + KenneyAssets[key]);

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

			this.kenneyAssets[key] = gltf;
		});

		await Promise.all(loadModels);
	}

	setup() {
		this.addSystem(new CannonPhysicsSystem(new Vector3(0, -5, 0), 50, false, 3));

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
}
