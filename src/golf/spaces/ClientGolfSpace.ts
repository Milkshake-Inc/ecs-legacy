import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Color from '@ecs/math/Color';
import Vector3 from '@ecs/math/Vector';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import ClientConnectionSystem from '@ecs/plugins/net/systems/ClientConnectionSystem';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Sprite from '@ecs/plugins/render/components/Sprite';
import RenderSystem from '@ecs/plugins/render/systems/RenderSystem';
import Transform from '@ecs/plugins/Transform';
import { LoadPixiAssets } from '@ecs/utils/PixiHelper';
import { LoadTexture } from '@ecs/utils/ThreeHelper';
import { AmbientLight, Color as ThreeColor, DirectionalLight, Mesh, MeshPhongMaterial, PerspectiveCamera, PlaneGeometry, RepeatWrapping, SphereGeometry, Texture } from 'three';
import PlayerBall from '../components/PlayerBall';
import ChatBoxSystem from '../systems/ChatBoxSystem';
import ClientBallControllerSystem from '../systems/client/ClientBallControllerSystem';
import ClientMapSystem from '../systems/client/ClientMapSystem';
import ClientSnapshotSystem from '../systems/client/ClientSnapshotSystem';
import PixiUISystem from '../systems/PixiUISystem';
import BaseGolfSpace from './BaseGolfSpace';
import { PlayerSpawnSystem } from '../utils/GolfShared';

const Assets = {
	DARK_TEXTURE: 'assets/prototype/textures/dark/texture_08.png'
};

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
		this.addSystem(new CannonPhysicsSystem(new Vector3(0, -5, 0), 1, false, 0));
		super.setup();

		this.addSystem(new ClientConnectionSystem(this.worldEngine), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ClientPingSystem());
		this.addSystem(new ClientMapSystem(this.golfAssets.gltfs));
		// this.addSystem(new FreeRoamCameraSystem(true));
		this.addSystem(new ThirdPersonCameraSystem());

		this.addSystem(new InputSystem());
		this.addSystem(new RenderSystem(1280, 720, undefined, 1, false));
		this.addSystem(new PixiUISystem());



		this.addSystem(new ChatBoxSystem())
		this.addSystem(new ClientSnapshotSystem(this.worldEngine, (entity, local) => {
			const player = this.createBall();

			player.components.forEach(c => {
				entity.add(c);
			});

			entity.add(PlayerBall);

			if(local) {
				console.log("Added third person camera")
				entity.add(ThirdPersonTarget);
			}
		}));
		this.addSystem(new ClientBallControllerSystem());

		// this.addSystem(new CourseEditorSystem(this.worldEngine, this.golfAssets.gltfs));
		// this.addSystem(new TransformLerpSystem());

		// this.addSystem(
		// 	new PlayerSpawnSystem(
		// );

		this.setupEntities();
	}

	setupEntities() {
		const crosshair = new Entity();
		crosshair.add(Transform, {
			position: new Vector3(1280 / 2, 720 / 2)
		});
		crosshair.add(Sprite, {
			imageUrl: Images.Crosshair,
		});

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

		this.addEntities(light, camera, crosshair);
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

	createBall() {
		const ball = super.createBall();

		ball.add(
			new Mesh(
				new SphereGeometry(0.04, 10, 10),
				new MeshPhongMaterial({
					color: Color.White,
					reflectivity: 0,
					specular: 0
				})
			),
			{ castShadow: true, receiveShadow: true }
		);

		return ball;
	}
}
