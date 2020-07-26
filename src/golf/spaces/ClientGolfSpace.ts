import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Color from '@ecs/plugins/math/Color';
import Vector3 from '@ecs/plugins/math/Vector';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import ClientConnectionSystem from '@ecs/plugins/net/systems/ClientConnectionSystem';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';
import CannonPhysicsSystem from '@ecs/plugins/physics/3d/systems/CannonPhysicsSystem';
import Sprite from '@ecs/plugins/render/2d/components/Sprite';
import SoundListener from '@ecs/plugins/sound/components/SoundListener';
import SoundSystem from '@ecs/plugins/sound/systems/SoundSystem';
import Transform from '@ecs/plugins/math/Transform';
import { LoadPixiAssets } from '@ecs/plugins/tools/PixiHelper';
import { LoadTexture } from '@ecs/plugins/tools/ThreeHelper';
import {
	AmbientLight,
	Color as ThreeColor,
	DirectionalLight,
	Mesh,
	MeshPhongMaterial,
	PerspectiveCamera,
	PlaneGeometry,
	RepeatWrapping,
	Texture
} from 'three';
import ClientRoomSystem from '../systems/client/ClientRoomSystem';
import ClientSnapshotSystem from '../systems/client/ClientSnapshotSystem';
import GolfCameraSystem from '../systems/client/GolfCameraSystem';
import GolfViewSystem from '../systems/client/GolfViewSystem';
import CartTrackSystem from '../systems/shared/CartTrackSystem';
import Config from '../utils/Config';
import BaseGolfSpace from './BaseGolfSpace';
import TweakSystem from '../systems/client/TweakSystem';
import { Colors } from '../ui/Shared';

const Images = {
	GroundTexture: 'assets/golf/ground-desert.jpg',
	Logo: 'assets/golf/logo.png',
	Noise: 'assets/golf/noise.png',
	Crosshair: 'assets/prototype/crosshair.png'
};

export default class ClientGolfSpace extends BaseGolfSpace {
	protected groundTexture: Texture;

	constructor(engine: Engine, open = false) {
		super(engine, open);
	}

	protected async preload() {
		[this.groundTexture] = await Promise.all([LoadTexture(Images.GroundTexture)]);

		await LoadPixiAssets(Images);
		await super.preload();
	}

	setup() {
		if (Config.debug) {
			this.addSystem(new CannonPhysicsSystem(new Vector3(0, -5, 0), 1, true, 0));
		}
		super.setup();

		this.addSystem(new ClientConnectionSystem(this.worldEngine), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ClientPingSystem());
		this.addSystem(new ClientRoomSystem());

		this.addSystem(new InputSystem(), 1000);

		this.addSystem(new ClientSnapshotSystem(this.worldEngine));
		this.addSystem(new GolfViewSystem());
		this.addSystem(new GolfCameraSystem(this.worldEngine));
		this.addSystem(new SoundSystem());

		this.addSystem(new CartTrackSystem());

		if (Config.tweak) {
			this.addSystem(new TweakSystem());
		}

		this.setupEntities();
	}

	setupEntities() {
		const crosshair = new Entity();
		crosshair.add(Transform, {
			position: new Vector3(1280 / 2, 720 / 2)
		});
		crosshair.add(Sprite, {
			imageUrl: Images.Crosshair
		});

		const camera = new Entity();
		camera.add(Transform, { z: 4, y: 2, x: 0, qx: -0.1 });
		camera.add(new PerspectiveCamera(undefined, undefined, 0.01, 1000));
		camera.add(SoundListener);

		const light = new Entity();
		light.add(new DirectionalLight(new ThreeColor(Color.White), 0.8), {
			castShadow: true
		});
		light.get(DirectionalLight).shadow.mapSize.set(1024, 1024);
		light.add(new AmbientLight(new ThreeColor(Color.White), 0.5));
		light.add(Transform);

		this.addEntities(light, camera, crosshair);
	}

	createGround() {
		const ground = super.createGround();
		this.groundTexture.repeat.set(1000, 1000);
		this.groundTexture.wrapT = this.groundTexture.wrapS = RepeatWrapping;
		ground.add(
			new Mesh(
				new PlaneGeometry(1000, 1000),
				new MeshPhongMaterial({ map: this.groundTexture, shininess: 0, color: Color.SandyBrown })
			),
			{
				castShadow: true,
				receiveShadow: true
			}
		);
		return ground;
	}

	// createBall() {
	// 	const ball = super.createBall();

	// 	ball.add(
	// 		new Mesh(
	// 			new SphereGeometry(0.04, 10, 10),
	// 			new MeshPhongMaterial({
	// 				color: Color.White,
	// 				reflectivity: 0,
	// 				specular: 0
	// 			})
	// 		),
	// 		{ castShadow: true, receiveShadow: true }
	// 	);

	// 	return ball;
	// }
}
