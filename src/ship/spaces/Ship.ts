import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { functionalSystem } from '@ecs/ecs/helpers';
import Color from '@ecs/math/Color';
import Vector3 from '@ecs/math/Vector';
import Input from '@ecs/plugins/input/components/Input';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import MeshShape from '@ecs/plugins/physics/components/MeshShape';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import {
	BackSide,
	BoxGeometry,
	Color as ThreeColor,
	DirectionalLight,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	PlaneBufferGeometry,
	ShaderMaterial,
	TextureLoader,
	HemisphereLight,
	CircleBufferGeometry,
	AmbientLight
} from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import ThirdPersonTarget from '../../engine/plugins/3d/systems/ThirdPersonTarget';
import { ShipRenderState } from '../systems/ShipRenderSystem';
import WaterFrag from './../shaders/water.frag';
import WaterVert from './../shaders/water.vert';
import WaveMachineSystem from '../systems/WaveMachineSystem';
import ThirdPersonCameraSystem from '../../engine/plugins/3d/systems/ThirdPersonCameraSystem';
import { Material, Vec3, Quaternion } from 'cannon-es';
import MathHelper from '@ecs/math/MathHelper';
import CharacterEntity from '@ecs/plugins/character/entity/CharacterEntity';
import CharacterControllerSystem from '@ecs/plugins/character/systems/CharacterControllerSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import FreeRoamCameraSystem from '@ecs/plugins/3d/systems/FreeRoamCameraSystem';
import CameraSwitchState, { CameraSwitchType } from '../components/CameraSwitchState';
import Key from '@ecs/input/Key';
import ParentTransformSystem from '../systems/ParentTransformSystem';
import SkyBox from '../components/SkyBox';
import Water from '../components/Water';

const Acceleration = 0.3;
const MaxSpeed = 30;
const RotateAcceleration = 0.02;
const Friction = 0.03;
const Gravity = new Vector3(0, -10, 0);

// Collision filter groups - must be powers of 2!
export enum PhysicsGroup {
	Terrain = 1,
	Player = 2,
	Folliage = 4
}

export class Ship extends Space {
	protected shipModel: GLTF;
	protected islandModel: GLTF;
	protected boxMan: GLTF;
	protected slippy = new Material('slippy');
	protected postMaterial: ShaderMaterial;
	protected island: Entity;
	protected ship: Entity;
	protected thirdPersonCameraSystem = new ThirdPersonCameraSystem();
	protected freeRoamCameraSystem = new FreeRoamCameraSystem();

	constructor(engine: Engine) {
		super(engine, 'ship');

		this.slippy.friction = Friction;
	}

	protected async preload() {
		[this.shipModel, this.islandModel, this.boxMan] = await Promise.all([
			LoadGLTF('assets/prototype/models/boat_large.gltf'),
			LoadGLTF('assets/prototype/models/island.gltf'),
			LoadGLTF('assets/prototype/models/boxman.glb')
		]);
	}

	setup() {
		this.setupEnvironment();
		// this.setupTerrain();

		this.addSystem(new WaveMachineSystem());
		this.addSystem(new CannonPhysicsSystem(Gravity, 10, false));


		const player = new CharacterEntity(this.boxMan, new Vector3(-150, 20, -100));

		this.addSystem(new ParentTransformSystem(
			all(PerspectiveCamera),
			[
				any(SkyBox, Water)
			], {
				followZ: true,
				followX: true,
				followY: false
			}))

		// player.add(ThirdPersonTarget)
		player.add(InputKeybindings.WASDINVERSE());
		player.get(CannonBody).collisionFilterGroup = PhysicsGroup.Player;
		player.get(CannonBody).collisionFilterMask = PhysicsGroup.Terrain | PhysicsGroup.Folliage;

		this.addEntity(player);
		const ship = new Entity();
		ship.add(Transform, { x: -180, y: 20, z: -100 });
		ship.add(Input);
		ship.add(InputKeybindings.WASD());
		ship.add(this.shipModel.scene.children[0]);
		ship.add(ThirdPersonTarget, { angle: 12, distance: 7 });
		ship.add(
			new CannonBody({
				mass: 20,
				material: this.slippy,
				collisionFilterGroup: PhysicsGroup.Player,
				collisionFilterMask: PhysicsGroup.Terrain | PhysicsGroup.Folliage
			})
		);
		ship.add(MeshShape);
		this.addEntity(ship);

		this.addSystem(new CharacterControllerSystem());
		this.addSystem(this.thirdPersonCameraSystem);

		this.addSystem(new InputSystem());

		this.addSystem(
			functionalSystem([all(CameraSwitchState, Input)], {
				entityUpdateFixed: (entity, dt) => {
					const input = entity.get(Input);
					const cameraState = entity.get(CameraSwitchState);

					if (input.jumpDown) {
						switch (cameraState.state) {
							case CameraSwitchType.Ship:
								cameraState.state = CameraSwitchType.Player;
								ship.remove(ThirdPersonTarget);
								player.add(ThirdPersonTarget);
								break;
							case CameraSwitchType.Player:
								cameraState.state = CameraSwitchType.Freeroam;
								player.remove(ThirdPersonTarget);
								this.removeSystem(this.thirdPersonCameraSystem);
								this.addSystem(this.freeRoamCameraSystem);
								break;
							case CameraSwitchType.Freeroam:
								cameraState.state = CameraSwitchType.Ship;
								this.removeSystem(this.freeRoamCameraSystem);
								this.addSystem(this.thirdPersonCameraSystem);
								ship.add(ThirdPersonTarget);
						}
					}
				}
			})
		);

		this.addSystem(
			functionalSystem([all(Transform, Input, CannonBody)], {
				entityUpdateFixed: (entity, dt) => {
					const input = entity.get(Input);
					const body = entity.get(CannonBody);

					let velocity = new Vector3();
					let angularVelocity = Vector3.From(body.angularVelocity);

					if (input.upDown) {
						velocity = velocity.add(Vector3.FORWARD.multiF(Acceleration * dt));
					}

					if (input.downDown) {
						velocity = velocity.add(Vector3.BACKWARD.multiF(Acceleration * dt));
					}

					if (input.leftDown) {
						angularVelocity = angularVelocity.add(Vector3.UP.multiF(RotateAcceleration * dt));
					}

					if (input.rightDown) {
						angularVelocity = angularVelocity.add(Vector3.DOWN.multiF(RotateAcceleration * dt));
					}

					if (this.postMaterial) {
						this.postMaterial.uniforms.tTime.value += dt;
					}

					const depth = -0.18;
					if (body.position.y < depth) {
						body.position.y = depth;
						body.velocity.y = 0;
						const original = new Vec3();
						body.quaternion.toEuler(original);

						original.x = MathHelper.lerp(original.x, 0, 0.1);
						original.z = MathHelper.lerp(original.z, 0, 0.1);

						body.quaternion.setFromEuler(original.x, original.y, original.z);
					} else {

					}

					// Limit max speed
					velocity = velocity.multiF(100);
					angularVelocity = angularVelocity.multiF(0.9);

					if (body.velocity.length() < MaxSpeed) {
						body.applyLocalForce(new Vec3(velocity.x, velocity.y, velocity.z), new Vec3(0, 0, 0));
					}
					// Check if airborn

					body.velocity = body.velocity.scale(0.99);

					body.angularVelocity.set(angularVelocity.x, angularVelocity.y, angularVelocity.z);

					// const a = ;
					// const x = Math.atan(body.velocity.x);
					const targetY = new Quaternion().setFromAxisAngle(new Vec3(1, 0, 0), Math.atan(body.velocity.y));
					// const targetX = new Quaternion().setFromAxisAngle(new Vec3(0, -1, 0), Math.atan(body.velocity.x) + (Math.PI / 2));
					// const targetZ = new Quaternion().setFromAxisAngle(new Vec3(0, 0, 1), Math.atan(body.velocity.z));

					const target = new Quaternion();
					target.mult(targetY, target);
					// target.mult(targetX, target);


					// const targetX = new Quaternion().setFromAxisAngle(new Vec3(1, 0, 0), a);
					body.quaternion.slerp(target, 0.01, body.quaternion);
					body.wakeUp()


				}
			})
		);
	}

	protected setupTerrain() {
		const island = new Entity();
		island.add(Transform, { y: -0.5 });
		island.add(this.islandModel.scene);
		island.add(
			new CannonBody({
				material: this.slippy,
				collisionFilterGroup: PhysicsGroup.Terrain,
				collisionFilterMask: PhysicsGroup.Player
			})
		);
		island.add(MeshShape);

		this.island = island;

		this.addEntities(island);
	}

	protected setupEnvironment() {
		const camera = new Entity();
		camera.add(Transform, { y: 2, z: 25 });
		camera.add(new PerspectiveCamera(75, 1280 / 720, 1, 1000));
		camera.add(CameraSwitchState);
		camera.add(Input);
		camera.add(InputKeybindings, { jumpKeybinding: [Key.C] });

		const light = new Entity();
		light.add(new DirectionalLight(new ThreeColor(Color.White), 1));
		light.add(new AmbientLight(new ThreeColor(Color.White), 0.4));
		light.add(new HemisphereLight());
		light.add(Transform, { x: 0, y: 1000, z: 1000 });
		light.get(HemisphereLight).intensity = 0.35;

		const cam = camera.get(PerspectiveCamera);
		this.postMaterial = new ShaderMaterial({
			vertexShader: WaterVert,
			fragmentShader: WaterFrag,
			uniforms: {
				cameraNear: { value: cam.near },
				cameraFar: { value: cam.far },
				tDiffuse: { value: null },
				tDepth: { value: null },
				tTime: { value: 0 }
			},
			transparent: true,
			fog: true
		});

		// Water
		const mesh = new Mesh(new CircleBufferGeometry(500, 30), this.postMaterial);


		const waterEntity = new Entity();
		waterEntity.add(Transform, { rx: -Math.PI / 2, });
		waterEntity.add(mesh);
		waterEntity.add(Water);


		const entity = this.worldEngine.entities.find(any(ShipRenderState));
		const renderState = entity.get(ShipRenderState);
		this.postMaterial.uniforms.tDepth.value = renderState.depthTarget.depthTexture;
		renderState.waterScene.add(mesh);

		// Skybox
		const textureFT = new TextureLoader().load('assets/prototype/textures/sky/nx.png');
		const textureLF = new TextureLoader().load('assets/prototype/textures/sky/px.png');

		const textureUP = new TextureLoader().load('assets/prototype/textures/sky/ny.png');
		const textureDN = new TextureLoader().load('assets/prototype/textures/sky/py.png');

		const textureBK = new TextureLoader().load('assets/prototype/textures/sky/nz.png');
		const textureRT = new TextureLoader().load('assets/prototype/textures/sky/pz.png');


		const materialArray = [
			new MeshBasicMaterial({ map: textureFT, fog: false }),
			new MeshBasicMaterial({ map: textureBK, fog: false }),
			new MeshBasicMaterial({ map: textureDN, fog: false }),
			new MeshBasicMaterial({ map: textureUP, fog: false }),

			new MeshBasicMaterial({ map: textureRT, fog: false }),
			new MeshBasicMaterial({ map: textureLF, fog: false })
		];

		for (let i = 0; i < 6; i++) {
			materialArray[i].side = BackSide;
		}

		const skyBox = new Entity();
		skyBox.add(Transform, { y: 100 });
		skyBox.add(Mesh, {
			geometry: new BoxGeometry(1000, 1000, 1000),
			material: materialArray
		});
		skyBox.add(SkyBox)

		this.addEntities(light, camera, skyBox, waterEntity);
	}
}
