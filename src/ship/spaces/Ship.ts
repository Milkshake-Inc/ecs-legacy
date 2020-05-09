import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { functionalSystem } from '@ecs/ecs/helpers';
import Color from '@ecs/math/Color';
import Vector3 from '@ecs/math/Vector';
import Input from '@ecs/plugins/input/components/Input';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import CannonPhysicsSystem, { DefaultGravity } from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
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
import CharacterEntity from '@ecs/plugins/character/entity/CharacterEntity';
import CharacterControllerSystem from '@ecs/plugins/character/systems/CharacterControllerSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import FreeRoamCameraSystem from '@ecs/plugins/3d/systems/FreeRoamCameraSystem';
import CameraSwitchState, { CameraSwitchType } from '../components/CameraSwitchState';
import Key from '@ecs/input/Key';
import ParentTransformSystem from '../systems/ParentTransformSystem';
import SkyBox from '../components/SkyBox';
import Water from '../components/Water';
import HelicopterEntity from '@ecs/plugins/vehicle/entity/HelicopterEntity';
import HelicopterControllerSystem from '@ecs/plugins/vehicle/systems/HelicopterControllerSystem';
import Vehicle from '@ecs/plugins/vehicle/components/Vehicle';
import BoatEntity from '@ecs/plugins/vehicle/entity/BoatEntity';
import BoatControllerSystem from '@ecs/plugins/vehicle/systems/BoatControllerSystem';
import MathHelper from '@ecs/math/MathHelper';
import { Vec3 } from 'cannon-es';
import CharacterTag from '@ecs/plugins/character/components/CharacterTag';
import SoundSystem from '@ecs/plugins/sound/systems/SoundSystem';
import SoundListener from '@ecs/plugins/sound/components/SoundListener';
import ChunkViewer from '@ecs/plugins/chunks/components/ChunkViewer';

const waterHeight = 60;

export class Ship extends Space {
	protected shipModel: GLTF;
	protected islandModel: GLTF;
	protected boxMan: GLTF;
	protected heli: GLTF;
	protected postMaterial: ShaderMaterial;
	protected island: Entity;
	protected ship: Entity;
	protected thirdPersonCameraSystem = new ThirdPersonCameraSystem();
	protected freeRoamCameraSystem = new FreeRoamCameraSystem();

	constructor(engine: Engine) {
		super(engine, 'ship');
	}

	protected async preload() {
		[this.shipModel, this.islandModel, this.boxMan, this.heli] = await Promise.all([
			LoadGLTF('assets/prototype/models/boat_large.gltf'),
			LoadGLTF('assets/prototype/models/island.gltf'),
			LoadGLTF('assets/prototype/models/boxman.glb'),
			LoadGLTF('assets/prototype/models/heli.glb')
		]);
	}

	setup() {
		this.setupEnvironment();

		const player = new CharacterEntity(this.boxMan, new Vector3(-200, 10, -100));
		const heli = new HelicopterEntity(this.heli, new Vector3(-190, 10, -100), 'assets/prototype/sounds/helicopter.mp3');
		const boat = new BoatEntity(this.shipModel, new Vector3(-180, 10, -100));
		this.addEntities(player, heli, boat);

		this.addSystem(new SoundSystem());
		this.addSystem(new WaveMachineSystem());
		this.addSystem(new CannonPhysicsSystem(DefaultGravity, 100, false));
		this.addSystem(new InputSystem());
		this.addSystem(new CharacterControllerSystem());
		this.addSystem(new HelicopterControllerSystem());
		this.addSystem(new BoatControllerSystem());

		this.addSystem(
			functionalSystem([all(CameraSwitchState, Input)], {
				setup: () => {
					// boat is first CameraSwitchState, so add some things for setup.
					boat.add(Input);
					boat.add(ThirdPersonTarget);
					boat.get(Vehicle).controller = player;

					this.addSystem(this.thirdPersonCameraSystem);
				},
				entityUpdateFixed: (entity, dt) => {
					const input = entity.get(Input);
					const cameraState = entity.get(CameraSwitchState);

					if (input.jumpDown) {
						switch (cameraState.state) {
							case CameraSwitchType.Boat:
								cameraState.state = CameraSwitchType.Helicopter;

								boat.remove(ThirdPersonTarget);
								boat.remove(Input);
								boat.get(Vehicle).controller = null;

								heli.add(ThirdPersonTarget);
								heli.add(Input);
								heli.get(Vehicle).controller = player;
								break;
							case CameraSwitchType.Helicopter:
								cameraState.state = CameraSwitchType.Player;

								heli.remove(ThirdPersonTarget);
								heli.remove(Input);
								heli.get(Vehicle).controller = null;

								player.add(ThirdPersonTarget);
								player.add(Input);
								break;
							case CameraSwitchType.Player:
								cameraState.state = CameraSwitchType.Freeroam;

								player.remove(ThirdPersonTarget);
								player.remove(Input);

								this.removeSystem(this.thirdPersonCameraSystem);
								this.addSystem(this.freeRoamCameraSystem);
								break;
							case CameraSwitchType.Freeroam:
								cameraState.state = CameraSwitchType.Boat;

								this.removeSystem(this.freeRoamCameraSystem);
								this.addSystem(this.thirdPersonCameraSystem);

								boat.add(ThirdPersonTarget);
								boat.add(Input);
								boat.get(Vehicle).controller = player;
						}
					}
				}
			})
		);

		this.addSystem(
			functionalSystem([all(Transform, CannonBody), any(Vehicle, CharacterTag)], {
				update: dt => {
					if (this.postMaterial) {
						this.postMaterial.uniforms.tTime.value += dt;
					}
				},
				entityUpdateFixed: (entity, dt) => {
					const body = entity.get(CannonBody);

					// Dont let stuff fall below water...
					const depth = waterHeight;
					if (body.position.y < depth) {
						body.position.y = depth;
						if (body.velocity.y < 0) {
							body.velocity.y = 0;
						}
						const original = new Vec3();
						body.quaternion.toEuler(original);

						original.x = MathHelper.lerp(original.x, 0, 0.1);
						original.z = MathHelper.lerp(original.z, 0, 0.1);

						body.quaternion.setFromEuler(original.x, original.y, original.z);
					}
				}
			})
		);
	}

	protected setupEnvironment() {
		const camera = new Entity();

		camera.add(Transform, { y: 2, z: 25 });
		camera.add(ChunkViewer);
		camera.add(new PerspectiveCamera(75, 1280 / 720, 1, 5000));
		camera.add(CameraSwitchState);
		camera.add(Input);
		camera.add(InputKeybindings, { jumpKeybinding: [Key.C] });
		camera.add(SoundListener);

		this.addSystem(
			new ParentTransformSystem(all(PerspectiveCamera), [any(SkyBox, Water)], {
				followZ: true,
				followX: true,
				followY: false
			})
		);

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
			fog: false
		});


		// Water
		const mesh = new Mesh(new CircleBufferGeometry(3000, 30), this.postMaterial);

		const waterEntity = new Entity();
		waterEntity.add(Transform, { y: waterHeight ,rx: -Math.PI / 2 });
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
			geometry: new BoxGeometry(6000, 6000, 6000),
			material: materialArray
		});
		skyBox.add(SkyBox);

		this.addEntities(light, camera, skyBox, waterEntity);
	}
}
