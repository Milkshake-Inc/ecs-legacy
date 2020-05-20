import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Color from '@ecs/math/Color';
import MathHelper from '@ecs/math/MathHelper';
import Vector3 from '@ecs/math/Vector';
import FreeRoamCameraSystem from '@ecs/plugins/3d/systems/FreeRoamCameraSystem';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Sprite from '@ecs/plugins/render/components/Sprite';
import RenderSystem from '@ecs/plugins/render/systems/RenderSystem';
import Transform from '@ecs/plugins/Transform';
import { LoadPixiAssets } from '@ecs/utils/PixiHelper';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { LoadTexture } from '@ecs/utils/ThreeHelper';
import { AmbientLight, Color as ThreeColor, DirectionalLight, Mesh, MeshPhongMaterial, PerspectiveCamera, PlaneGeometry, RepeatWrapping, Texture } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { KenneyAssets } from '../constants/Assets';
import { CourseEditorSystem } from '../systems/CourseEditorSystem';
import PixiUISystem from '../systems/PixiUISystem';
import BaseGolfSpace from './BaseGolfSpace';
import ClientConnectionSystem from '@ecs/plugins/net/systems/ClientConnectionSystem';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';
const Assets = {
	DARK_TEXTURE: 'assets/prototype/textures/dark/texture_08.png'
};

type AssetsMap<T, K> = {
	[P in keyof T]: K;
};

export type KenneyAssetsGLTF = Partial<AssetsMap<typeof KenneyAssets, GLTF>>;

export class TransfromLerp extends Transform {}

class TransformLerpSystem extends IterativeSystem {
	constructor() {
		super(makeQuery(all(Transform, TransfromLerp)));
	}

	updateEntity(entity: Entity, deltaTime: number) {
		const target = entity.get(TransfromLerp);
		const current = entity.get(Transform);

		if (!target.position) {
			target.position = current.position.clone();
		}

		current.position = MathHelper.lerpVector3(current.position, target.position, 0.4);
		current.scale = MathHelper.lerpVector3(current.scale, target.scale, 0.4);
		current.quaternion = current.quaternion.slerp(target.quaternion, 0.4);
	}
}

const Images = {
	Logo: 'assets/golf/logo.png',
	Noise: 'assets/golf/noise.png',
	Crosshair: 'assets/prototype/crosshair.png',
}

export default class ClientGolfSpace extends BaseGolfSpace {
	protected darkTexture: Texture;

	constructor(engine: Engine, open = false) {
		super(engine, open);
	}

	protected async preload() {
		[this.darkTexture] = await Promise.all([LoadTexture(Assets.DARK_TEXTURE)]);

		await LoadPixiAssets(Images);
		await super.preload();
	}

	setup() {
		super.setup();

		this.addSystem(new ClientConnectionSystem(this.worldEngine), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ClientPingSystem());

		const camera = new Entity();
		camera.add(Transform, { z: 4, y: 2, x: 0, qx: -0.1 });
		camera.add(new PerspectiveCamera(75, 1280 / 720, 0.01, 1000));

		const light = new Entity();
		light.add(new DirectionalLight(new ThreeColor(Color.White), 0.8), {
			castShadow: true
		});
		light.get(DirectionalLight).shadow.mapSize.set(1024 * 4, 1024 * 4);
		light.add(new AmbientLight(new ThreeColor(Color.White), 0.5));
		light.add(Transform, { x: 5 / 10, y: 10 / 10, z: 5 / 10 });

		this.addEntities(light, camera);

		this.addSystem(new FreeRoamCameraSystem(false));

		this.addSystem(new InputSystem());
		this.addSystem(new TransformLerpSystem());

		this.addSystem(new CourseEditorSystem(this.worldEngine, this.kenneyAssets));

		this.addSystem(new RenderSystem(1280, 720, undefined, 1, false));
		this.addSystem(new PixiUISystem());

		const crosshair = new Entity();
		crosshair.add(Transform, {
			position: new Vector3(1280 / 2, 720 / 2)
		});
		crosshair.add(Sprite, {
			imageUrl: Images.Crosshair,
		});
		this.addEntity(crosshair);
	}

	createGround() {
		const ground = super.createGround();
		this.darkTexture.repeat.set(1000, 1000);
		this.darkTexture.wrapT = this.darkTexture.wrapS = RepeatWrapping;
		ground.add(new Mesh(new PlaneGeometry(1000, 1000), new MeshPhongMaterial({ map: this.darkTexture, shininess: 0 })), {
			castShadow: true,
			receiveShadow: true
		});
		return ground;
	}
}
