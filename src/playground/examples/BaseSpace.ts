import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Color from '@ecs/math/Color';
import Vector3 from '@ecs/math/Vector';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { LoadTexture } from '@ecs/utils/ThreeHelper';
import { Body, Material, Plane, Vec3, Sphere as CannonSphere } from 'cannon-es';
import {
	AmbientLight,
	Color as ThreeColor,
	DirectionalLight,
	Mesh,
	MeshPhongMaterial,
	PerspectiveCamera,
	PlaneGeometry,
	RepeatWrapping,
	Texture,
	BoxGeometry
} from 'three';

const Assets = {
	BOX_MAN: 'assets/prototype/models/boxman.glb',
	DARK_TEXTURE: 'assets/prototype/textures/dark/texture_08.png',
	ORANGE_TEXTURE: 'assets/prototype/textures/orange/texture_01.png',
	PURPLE_TEXTURE: 'assets/prototype/textures/purple/texture_01.png',
	RED_TEXTURE: 'assets/prototype/textures/red/texture_01.png',
	GREEN_TEXTURE: 'assets/prototype/textures/green/texture_01.png'
};

export default class BaseSpace extends Space {
	protected darkTexture: Texture;
	protected orangeTexture: Texture;
	protected purpleTexture: Texture;
	protected redTexture: Texture;
	protected greenTexture: Texture;

	constructor(engine: Engine, name: string) {
		super(engine, name);
	}

	protected async preload() {
		[this.darkTexture, this.orangeTexture, this.purpleTexture, this.redTexture, this.greenTexture] = await Promise.all([
			LoadTexture(Assets.DARK_TEXTURE),
			LoadTexture(Assets.ORANGE_TEXTURE),
			LoadTexture(Assets.PURPLE_TEXTURE),
			LoadTexture(Assets.RED_TEXTURE),
			LoadTexture(Assets.GREEN_TEXTURE)
		]);
	}

	createBall(position: Vector3, radius = 0.05) {
		const entity = new Entity();
		entity.add(Transform, { position });
		entity.add(
			new Mesh(
				new BoxGeometry(radius, radius, radius),
				new MeshPhongMaterial({
					map: this.redTexture,
					flatShading: true,
					reflectivity: 0,
					specular: 0
				})
			)
		);
		entity.add(
			new Body({
				mass: 0.1,
				angularVelocity: new Vec3(Math.random() * 10, Math.random() * 10, Math.random() * 10)
			})
		);
		entity.add(new CannonSphere(radius));

		return entity;
	}

	setup() {
		this.addSystem(new CannonPhysicsSystem(new Vector3(0, -10, 0), 1, true));

		const slippy = new Material('slippy');
		slippy.friction = 0.04;

		const camera = new Entity();
		camera.add(Transform, { z: 4, y: 4, x: 0, qx: -0.1 });
		const cameraa = new PerspectiveCamera(75, 1280 / 720, 0.1, 1000);
		camera.add(cameraa);

		const light = new Entity();
		light.add(new DirectionalLight(new ThreeColor(Color.White), 1), {
			castShadow: true
		});
		light.get(DirectionalLight).shadow.mapSize.set(1024, 1024);
		light.get(DirectionalLight).shadow.radius = 80;
		light.add(new AmbientLight(new ThreeColor(Color.White), 0.4));
		light.add(Transform, { x: 1, y: 10, z: 0 });

		// Ground
		const ground = new Entity();
		ground.add(Transform, { rx: -Math.PI / 2 });
		this.darkTexture.repeat.set(400, 400);
		this.darkTexture.wrapT = this.darkTexture.wrapS = RepeatWrapping;
		ground.add(new Mesh(new PlaneGeometry(1000, 1000), new MeshPhongMaterial({ map: this.darkTexture, shininess: 0 })), {
			castShadow: true,
			receiveShadow: true
		});
		ground.add(
			new Body({
				material: slippy
			})
		);
		ground.add(new Plane());

		light.get(Transform).look(Vector3.ZERO);

		this.addEntities(light, camera, ground);
	}
}
