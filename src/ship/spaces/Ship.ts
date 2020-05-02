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
	TextureLoader
} from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import ThirdPersonTarget from '../components/ThirdPersonTarget';
import { ShipRenderState } from '../systems/ShipRenderSystem';
import WaterFrag from './../shaders/water.frag';
import WaterVert from './../shaders/water.vert';
import WaveMachineSystem from '../systems/WaveMachineSystem';
import ThirdPersonCameraSystem from '../systems/ThirdPersonCameraSystem';
import { Body, Material, Vec3 } from 'cannon';
import { Look } from '@ecs/plugins/physics/utils/PhysicsUtils';
import MathHelper from '@ecs/math/MathHelper';

const Acceleration = 0.01;
const MaxSpeed = 15;
const RotateAcceleration = 0.01;
const MaxRotationalSpeed = 3;
const Friction = 0.03;
const Gravity = new Vector3(0, -10, 0);

export class Ship extends Space {
	protected shipModel: GLTF;
	protected islandModel: GLTF;
	protected slippy = new Material('slippy');
	protected postMaterial: ShaderMaterial;
	protected island: Entity;

	constructor(engine: Engine) {
		super(engine, 'ship');

		this.slippy.friction = Friction;
	}

	protected async preload() {
		[this.shipModel, this.islandModel] = await Promise.all([
			LoadGLTF('assets/prototype/models/boat_large.gltf'),
			LoadGLTF('assets/prototype/models/island.gltf')
		]);
	}

	setup() {
		this.setupEnvironment();
		this.setupTerrain();
		this.setupPlayer();

		this.addSystem(new WaveMachineSystem());
		this.addSystem(new CannonPhysicsSystem(Gravity, 10, true));
		this.addSystem(new ThirdPersonCameraSystem());
		this.addSystem(new InputSystem());
		this.addSystem(
			functionalSystem([all(Transform, Input, Body)], {
<<<<<<< HEAD
				entityUpdateFixed: (entity, dt) => {
=======
				entityUpdateFixed(entity, dt) {
					if (this.island) {
						this.island.get(Body).position.y += 0.001;
					}

>>>>>>> 🎨  Fixing camera shake
					const input = entity.get(Input);
					const body = entity.get(Body);

					const forward = Look(body);
					const up = Look(body, Vector3.UP);

					const velocity = new Vec3();
					const angularVelocity = new Vec3();

					if (input.upDown) {
						velocity.vadd(forward.mult(Acceleration * dt), velocity);
					}

					if (input.downDown) {
						velocity.vsub(forward.mult(Acceleration * dt), velocity);
					}

					if (input.leftDown) {
						angularVelocity.vadd(up.mult(RotateAcceleration * dt), angularVelocity);
					}

					if (input.rightDown) {
						angularVelocity.vsub(up.mult(RotateAcceleration * dt), angularVelocity);
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
					}

					// Limit max speed
					if (body.velocity.norm() < MaxSpeed) {
						body.velocity.vadd(velocity, body.velocity);
					}

					if (body.angularVelocity.norm() < MaxRotationalSpeed) {
						body.angularVelocity.vadd(angularVelocity, body.angularVelocity);
					}

					// Friction
					body.angularVelocity.mult(0.9, body.angularVelocity);
					body.velocity.mult(0.99, body.velocity);
				}
			})
		);
	}

	protected setupPlayer() {
		const ship = new Entity();
		ship.add(Transform, { z: 20, y: 2 });
		ship.add(Input);
		ship.add(InputKeybindings.WASD());
		ship.add(this.shipModel.scene.children[0]);
		ship.add(ThirdPersonTarget, { angle: 12, distance: 7 });
		ship.add(new Body({ mass: 20, material: this.slippy }));
		ship.add(MeshShape);

		this.addEntities(ship);
	}

	protected setupTerrain() {
		const island = new Entity();
		island.add(Transform, { y: -0.5 });
		island.add(this.islandModel.scene);
		island.add(new Body({ material: this.slippy }));
		island.add(MeshShape);

		this.island = island;

		this.addEntities(island);
	}

	protected setupEnvironment() {
		const camera = new Entity();
		camera.add(Transform, { y: 2, z: 25 });
		camera.add(new PerspectiveCamera(75, 1280 / 720, 1, 1000));

		const light = new Entity();
		light.add(new DirectionalLight(new ThreeColor(Color.White), 1.9));
		light.add(Transform, { x: 1, y: 1, z: 0 });

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

		// Ground
		// const ground = new Entity();
		// ground.add(Transform, { z: 5 });
		// ground.add(
		// 	new Body({
		// 		material: this.slippy
		// 	})
		// );
		// ground.add(new Plane());

		// Water
		const mesh = new Mesh(new PlaneBufferGeometry(window.innerWidth, window.innerHeight, 100, 100), this.postMaterial);
		mesh.rotation.x = -Math.PI / 2;

		const entity = this.worldEngine.entities.find(any(ShipRenderState));
		const renderState = entity.get(ShipRenderState);
		this.postMaterial.uniforms.tDepth.value = renderState.depthTarget.depthTexture;
		renderState.waterScene.add(mesh);

		// Skybox
		const textureFT = new TextureLoader().load('assets/prototype/textures/sky/nx.png');
		const textureBK = new TextureLoader().load('assets/prototype/textures/sky/nz.png');
		const textureUP = new TextureLoader().load('assets/prototype/textures/sky/ny.png');
		const textureDN = new TextureLoader().load('assets/prototype/textures/sky/py.png');
		const textureRT = new TextureLoader().load('assets/prototype/textures/sky/pz.png');
		const textureLF = new TextureLoader().load('assets/prototype/textures/sky/px.png');

		const materialArray = [
			new MeshBasicMaterial({ map: textureFT, fog: false }),
			new MeshBasicMaterial({ map: textureBK, fog: false }),
			new MeshBasicMaterial({ map: textureUP, fog: false }),
			new MeshBasicMaterial({ map: textureDN, fog: false }),
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

		this.addEntities(light, camera, skyBox);
	}
}
