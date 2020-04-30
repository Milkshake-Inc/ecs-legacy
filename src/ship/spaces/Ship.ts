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
import { Body, Vec3, Plane, Material } from 'cannon';
import { Look } from '@ecs/plugins/physics/utils/PhysicsUtils';
import MathHelper from '@ecs/math/MathHelper';

let Elapsed = 0;
const ShipSpeed = 1;
const Gravity = new Vector3(0, -10, 0);

export class Ship extends Space {
	protected shipModel: GLTF;
	protected islandModel: GLTF;

	constructor(engine: Engine) {
		super(engine, 'ship');
	}

	protected async preload() {
		[this.shipModel, this.islandModel] = await Promise.all([
			LoadGLTF('assets/prototype/models/boat_large.gltf'),
			LoadGLTF('assets/prototype/models/island.gltf')
		]);
	}

	setup() {
		const camera = new Entity();
		camera.add(Transform, { y: 2, z: 25 });
		camera.add(new PerspectiveCamera(75, 1280 / 720, 1, 1000));

		const light = new Entity();
		light.add(new DirectionalLight(new ThreeColor(Color.White), 1.9));
		light.add(Transform, { x: 1, y: 1, z: 0 });

		const slippy = new Material('slippy');
		slippy.friction = 0.03;

		const ship = new Entity();
		ship.add(Transform, { z: 20, y: 20 });
		ship.add(Input);
		ship.add(InputKeybindings.WASD());
		ship.add(this.shipModel.scene.children[0]);
		ship.add(ThirdPersonTarget, { angle: 8, distance: 7 });
		ship.add(new Body({ mass: 1, material: slippy }));
		ship.add(MeshShape);

		window['ship'] = ship;

		const island = new Entity();
		island.add(Transform, { y: -0.5 });
		island.add(this.islandModel.scene);
		island.add(new Body({ material: slippy }));
		island.add(MeshShape);

		const entity = this.worldEngine.entities.find(any(ShipRenderState));
		const renderState = entity.get(ShipRenderState);

		const cam = camera.get(PerspectiveCamera);
		const postMaterial = new ShaderMaterial({
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

		const ground = new Entity();
		ground.add(Transform, { z: 5 });
		ground.add(
			new Body({
				material: slippy
			})
		);
		ground.add(new Plane());
		this.addEntity(ground);
		window['ground'] = ground;

		// Water
		const mesh = new Mesh(new PlaneBufferGeometry(window.innerWidth, window.innerHeight, 100, 100), postMaterial);
		mesh.rotation.x = -Math.PI / 2;
		postMaterial.uniforms.tDepth.value = renderState.depthTarget.depthTexture;
		renderState.waterScene.add(mesh);

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
		skyBox.add(Transform);
		skyBox.add(Mesh, {
			geometry: new BoxGeometry(1000, 1000, 1000),
			material: materialArray
		});

		const cube = new Entity();
		cube.add(Transform);
		cube.add(Mesh, {
			geometry: new BoxGeometry(),
			material: new MeshBasicMaterial({ map: new TextureLoader().load('assets/prototype/textures/red/texture_01.png') })
		});

		this.addEntities(light, camera, ship, island, skyBox);

		this.addSystem(new InputSystem());
		this.addSystem(
			functionalSystem([all(Transform, Input, Body)], {
				entityUpdate(entity, dt) {
					const input = entity.get(Input);
					const body = entity.get(Body);

					const force = new Vec3();
					const forward = Look(body);
					const up = Look(body, Vector3.UP);

					if (input.upDown) {
						forward.mult(ShipSpeed * dt, force);
					}

					if (input.downDown) {
						forward.mult(-ShipSpeed * dt, force);
					}

					if (input.leftDown) {
						// body.quaternion = body.quaternion.mult(new Quaternion().setFromEuler(0, 0.02, 0));
						body.angularVelocity = body.angularVelocity.vadd(up.mult(ShipSpeed * 0.08));
						console.log(body.angularVelocity);
					}

					if (input.rightDown) {
						// body.quaternion = body.quaternion.mult(new Quaternion().setFromEuler(0, -0.02, 0));
						body.angularVelocity = body.angularVelocity.vadd(up.mult(-ShipSpeed * 0.08));
					}

					Elapsed += dt;
					postMaterial.uniforms.tTime.value = Elapsed;

					const depth = -0.18;
					if (body.position.y < depth) {
						body.position.y = depth;
						body.velocity.y = 0;
						const original = new Vec3();
						body.quaternion.toEuler(original);

						original.x = MathHelper.lerp(original.x, 0, 0.1);
						original.z = MathHelper.lerp(original.z, 0, 0.1);

						body.quaternion.setFromEuler(original.x, original.y, original.z);
						// body.applyForce(new Vec3(0, 0.001, 0), body.position);
						// body.quaternion.
					}

					// pos.y = getWaveHeight(pos.x, pos.z, Elapsed);
					body.applyForce(force, body.position);
				}
			})
		);

		this.addSystem(new WaveMachineSystem());
		this.addSystem(new CannonPhysicsSystem(Gravity, 10, true));
		this.addSystem(new ThirdPersonCameraSystem());

		// const ray = new Entity();
		// ray.add(Transform, { rotation: new Vector3(0, -1, 0) });
		// ray.add(Raycast);
		// ray.add(RaycastDebug);
		// this.addEntities(ray);

		// this.addSystem(
		// 	functionalSystemQuery(
		// 		{
		// 			ship: all(Input),
		// 			raycast: all(Raycast)
		// 		},
		// 		{
		// 			updateFixed: queries => {
		// 				const { position } = queries.ship.first.get(Transform);
		// 				const boatMesh = queries.ship.first.get(Mesh);
		// 				const { intersects } = queries.raycast.first.get(Raycast);

		// 				// Reposition ray to boats position
		// 				queries.raycast.first.get(Transform).position.set(position.x, position.y + 50, position.z);

		// 				if (intersects.length > 0) {
		// 					for (const intersect of intersects) {
		// 						if (intersect.object != boatMesh) {
		// 							position.y = intersect.point.y;
		// 							return;
		// 						}
		// 					}
		// 				}
		// 			}
		// 		}
		// 	)
		// );
	}
}
