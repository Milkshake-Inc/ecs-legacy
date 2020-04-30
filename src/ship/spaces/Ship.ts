import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { functionalSystem } from '@ecs/ecs/helpers';
import Color from '@ecs/math/Color';
import Vector3 from '@ecs/math/Vector';
import Raycast, { RaycastDebug } from '@ecs/plugins/3d/components/Raycaster';
import Input from '@ecs/plugins/input/components/Input';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import MeshShape from '@ecs/plugins/physics/components/MeshShape';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { Body } from 'cannon';
import { BackSide, BoxGeometry, Color as ThreeColor, DirectionalLight, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneBufferGeometry, ShaderMaterial, TextureLoader } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import ThirdPersonTarget from '../components/ThirdPersonTarget';
import { ShipRenderState } from '../systems/ShipRenderSystem';
import ThirdPersonCameraSystem from '../systems/ThirdPersonCameraSystem';
import WaveMachineSystem from '../systems/WaveMachineSystem';
import WaterFrag from './../shaders/water.frag';
import WaterVert from './../shaders/water.vert';

const ShipSpeed = 0.1;
let Elapsed = 0;

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
		camera.add(Transform, { y: 2, z: 5 });
		camera.add(new PerspectiveCamera(75, 1280 / 720, 1, 1000));

		const light = new Entity();
		light.add(new DirectionalLight(new ThreeColor(Color.White), 1.9));
		light.add(Transform, { x: 1, y: 1, z: 0 });

		const ship = new Entity();
		ship.add(Transform, { y: -0.17 });
		ship.add(Input);
		ship.add(InputKeybindings.WASD());
		ship.add(this.shipModel.scene.children[0]);
		ship.add(ThirdPersonTarget);
		// ship.add(new Body({ mass: 1 }));
		// ship.add(MeshShape);
		ship.add(ThirdPersonTarget, { angle: 8, distance: 7 });

		const island = new Entity();
		island.add(Transform, { x: 0, y: 2, z: -20 });
		island.add(this.islandModel.scene);
		island.add(new Body());
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
			functionalSystem([all(Transform, Input)], {
				entityUpdate(entity, dt) {
					const pos = entity.get(Transform);
					const input = entity.get(Input);

					const directionX = Math.cos(pos.rotation.y + Math.PI / 2) * ShipSpeed;
					const directionY = Math.sin(pos.rotation.y + Math.PI / 2) * ShipSpeed;

					if (input.upDown) {
						pos.z -= directionY;
						pos.x += directionX;
					}
					if (input.downDown) {
						pos.z += directionY;
						pos.x -= directionX;
					}

					if (input.leftDown) {
						pos.rotation.y += 0.02;
					}

					if (input.rightDown) {
						pos.rotation.y -= 0.02;
					}

					Elapsed += dt;
					postMaterial.uniforms.tTime.value = Elapsed;

					// pos.y = getWaveHeight(pos.x, pos.z, Elapsed);
				}
			})
		);

		this.addSystem(new WaveMachineSystem());
		this.addSystem(new ThirdPersonCameraSystem());
		this.addSystem(new CannonPhysicsSystem(Vector3.ZERO, 2, true));

		const ray = new Entity();
		ray.add(Transform, { rotation: new Vector3(0, -1, 0) });
		ray.add(Raycast);
		ray.add(RaycastDebug);
		this.addEntities(ray);

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
