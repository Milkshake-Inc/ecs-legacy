import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Color from '@ecs/math/Color';
import Random from '@ecs/math/Random';
import Vector3 from '@ecs/math/Vector';
import FreeRoamCameraSystem from '@ecs/plugins/3d/systems/FreeRoamCameraSystem';
import RenderSystem from '@ecs/plugins/3d/systems/RenderSystem';
import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { LoadGLTF, LoadTexture } from '@ecs/utils/ThreeHelper';
import { Body, Box, Plane, Vec3, RaycastVehicle, Spring, Cylinder, Material } from 'cannon';
import {
	AmbientLight,
	BoxGeometry,
	Color as ThreeColor,
	DirectionalLight,
	Mesh,
	MeshPhongMaterial,
	PerspectiveCamera,
	PlaneGeometry,
	RepeatWrapping,
	Texture,
	Fog,
	PCFSoftShadowMap,
	AnimationMixer,
	AnimationClip,
	Camera
} from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import { functionalSystem } from '@ecs/ecs/helpers';
import { all } from '@ecs/utils/QueryHelper';
import Keyboard from '@ecs/input/Keyboard';
import Key from '@ecs/input/Key';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import MeshShape from '@ecs/plugins/physics/components/MeshShape';
import BoundingBoxShape from '@ecs/plugins/physics/components/BoundingBoxShape';
import BoundingCapsuleShape from '@ecs/plugins/physics/components/BoundingCapsuleShape';
import CapsuleShape from '@ecs/plugins/physics/components/CapsuleShape';

const Assets = {
	BOX_MAN: 'assets/prototype/models/boxman.glb',
	DARK_TEXTURE: 'assets/prototype/textures/dark/texture_08.png',
	ORANGE_TEXTURE: 'assets/prototype/textures/orange/texture_01.png',
	PURPLE_TEXTURE: 'assets/prototype/textures/purple/texture_01.png',
	RED_TEXTURE: 'assets/prototype/textures/red/texture_01.png',
	GREEN_TEXTURE: 'assets/prototype/textures/green/texture_01.png'
};

class AnimationSpace extends Space {
	protected boxman: GLTF;
	protected darkTexture: Texture;
	protected orangeTexture: Texture;
	protected purpleTexture: Texture;
	protected redTexture: Texture;
	protected greenTexture: Texture;

	constructor(engine: Engine) {
		super(engine, 'animation');
	}

	protected async preload() {
		[this.boxman, this.darkTexture, this.orangeTexture, this.purpleTexture, this.redTexture, this.greenTexture] = await Promise.all([
			LoadGLTF(Assets.BOX_MAN),
			LoadTexture(Assets.DARK_TEXTURE),
			LoadTexture(Assets.ORANGE_TEXTURE),
			LoadTexture(Assets.PURPLE_TEXTURE),
			LoadTexture(Assets.RED_TEXTURE),
			LoadTexture(Assets.GREEN_TEXTURE)
		]);
	}

	createBox(z: number) {
		const box = new Entity();
		box.add(Transform, { y: 2 + z * 0.5, qy: 0.5, z: -1, x: Random.float(-3, 3) });

		const texture = Random.fromArray([this.orangeTexture, this.purpleTexture, this.redTexture, this.greenTexture]);
		const size = Random.float(0.5, 0.5);
		box.add(new Mesh(new BoxGeometry(size, size, size), new MeshPhongMaterial({ map: texture })), {
			castShadow: true,
			receiveShadow: true
		});
		box.add(
			new Body({
				mass: 0.1,
				angularVelocity: new Vec3(Math.random() * 10, Math.random() * 10, Math.random() * 10)
			})
		);
		box.add(BoundingBoxShape);
		return box;
	}

	setup() {
		this.addSystem(new CannonPhysicsSystem(new Vector3(0, -10, 0), 1, true));

		const slippy = new Material('slippy');
		slippy.friction = 0.04;
		const camera = new Entity();
		camera.add(Transform, { z: 4, y: 2, x: 0, qx: -0.1 });
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

		for (let index = 0; index < 100; index++) {
			this.addEntities(this.createBox(index));
		}

		this.addEntities(light, camera, ground);
		this.addSystem(new ThirdPersonCameraSystem());

		const player = new Entity();
		player.add(Transform, { ry: 2, y: 10 });
		player.add(ThirdPersonTarget);
		player.add(this.boxman.scene, {
			castShadow: true,
			receiveShadow: true
		});

		player.add(
			new CannonBody({
				mass: 1,
				type: Body.DYNAMIC,
				material: slippy,
				// angularVelocity: new Vec3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
				fixedRotation: true
			}),
			{
				offset: new Vector3(0, -0.2, 0)
			}
		);
		player.add(CapsuleShape, { radius: 0.2, height: 1 });

		this.boxman.scene.traverse(a => {
			a.castShadow = true;
		});
		const key = new Keyboard();
		this.addEntities(player);

		const mixer = new AnimationMixer(this.boxman.scene);

		const sprinting = mixer.clipAction(AnimationClip.findByName(this.boxman.animations, 'sprint'));
		const idle = mixer.clipAction(AnimationClip.findByName(this.boxman.animations, 'idle'));

		// idle.crossFadeTo(idle, 1000, false);
		// debugger;
		setInterval(() => {
			mixer.update(16 / 1500);

			const a = camera.get(Transform).position.sub(player.get(Transform).position).normalize();

			const angle = Math.atan2(a.z, a.x);
			// const trans = camera.get(Transform);
			// console.log(trans.rotation);
			// console.log(cameraa.rotation.y);

			player.get(CannonBody).quaternion.setFromAxisAngle(new Vec3(0, -1, 0), angle + Math.PI / 2);

			player.get(CannonBody).velocity.x = 0;
			player.get(CannonBody).velocity.z = 0;
			if (key.isDown(Key.W) || key.isDown(Key.S)) {
				// player.get(Transform).position.z += 0.05;
				player.get(CannonBody).applyLocalImpulse(new Vec3(0, 0, key.isDown(Key.W) ? 5 : -5), new Vec3(0, 0, 0));
				idle.stop();
				sprinting.play();
			} else {
				const animation = AnimationClip.findByName(this.boxman.animations, 'idle');
				idle.play();
				sprinting.stop();
			}

			if (key.isDown(Key.A)) {
				player.get(CannonBody).applyLocalImpulse(new Vec3(2, 0, 0), new Vec3(0, 0, 0));
			}

			if (key.isDown(Key.D)) {
				player.get(CannonBody).applyLocalImpulse(new Vec3(-2, 0, 0), new Vec3(0, 0, 0));
			}

			if (key.isPressed(Key.SPACEBAR)) {
				player.get(CannonBody).applyLocalForce(new Vec3(0, 300, 0), new Vec3(0, 0, 0));
			}
			key.update();
			// player.get(CannonBody).velocity.x *= 0.99;
			// player.get(CannonBody).velocity.z *= 0.99;
		}, 16);
	}
}

const engine = new ThreeEngine(
	new RenderSystem({
		color: 0x262626,
		configure: (renderer, scene) => {
			// renderer.setPixelRatio(2);
			renderer.shadowMap.type = PCFSoftShadowMap;
			renderer.shadowMap.enabled = true;

			scene.fog = new Fog(0x262626, 10, 200);
		}
	})
);

engine.registerSpaces(new AnimationSpace(engine));

engine.getSpace('animation').open();

console.log('🎉 Client');
