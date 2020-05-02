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
import { Body, Box, Plane, Vec3 } from 'cannon';
import { AmbientLight, BoxGeometry, Color as ThreeColor, DirectionalLight, Mesh, MeshPhongMaterial, PerspectiveCamera, PlaneGeometry, RepeatWrapping, Texture, Fog, PCFSoftShadowMap } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

const Assets = {
    BOX_MAN: 'assets/prototype/models/boxman.glb',
    DARK_TEXTURE: 'assets/prototype/textures/dark/texture_08.png',
    ORANGE_TEXTURE: 'assets/prototype/textures/orange/texture_01.png',
    PURPLE_TEXTURE: 'assets/prototype/textures/purple/texture_01.png',
    RED_TEXTURE: 'assets/prototype/textures/red/texture_01.png',
    GREEN_TEXTURE: 'assets/prototype/textures/green/texture_01.png',
}

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
            LoadTexture(Assets.GREEN_TEXTURE),
		]);
	}

    createBox(z: number) {
        const box = new Entity();
        box.add(Transform, { y: 2 + (z * 0.5), qy: 0.5, z: -1, x: Random.float(-3, 3) });

        const texture = Random.fromArray([
            this.orangeTexture,
            this.purpleTexture,
            this.redTexture,
            this.greenTexture
        ]);
        const size = Random.float(0.5, 0.5);
		box.add(new Mesh(
            new BoxGeometry(size, size, size),
            new MeshPhongMaterial({ map: texture })
        ), {
            castShadow: true,
            receiveShadow: true
        });
        box.add(new Body({
            mass: 10,
            angularVelocity: new Vec3(Math.random() * 10, Math.random() * 10, Math.random() * 10)
        }));
        box.add(new Box(new Vec3(size / 2, size / 2, size / 2)));
        return box;
    }

	setup() {
        this.addSystem(new CannonPhysicsSystem(new Vector3(0, -10, 0), 1, false));

        const camera = new Entity();
        camera.add(Transform, { z: 4, y: 2, x: 0, qx: -0.1 });
        const cameraa = new PerspectiveCamera(75, 1280 / 720, 0.1, 1000);
        camera.add(cameraa)

        const light = new Entity();
        light.add(new DirectionalLight(new ThreeColor(Color.White), 1), {
            castShadow: true,
        });
        light.get(DirectionalLight).shadow.mapSize.set(1024, 1024);
        // light.get(DirectionalLight).shadow.radius = 80;
        light.add(new AmbientLight(new ThreeColor(Color.White), 0.4));
        light.add(Transform, { x: 1, y: 1, z: 0 });

        // Ground
		const ground = new Entity();
        ground.add(Transform, { rx: -Math.PI / 2 });
        this.darkTexture.repeat.set(400, 400);
        this.darkTexture.wrapT = this.darkTexture.wrapS = RepeatWrapping;
		ground.add(new Mesh(
            new PlaneGeometry(1000, 1000),
            new MeshPhongMaterial({ map: this.darkTexture })
        ), {
            castShadow: true,
            receiveShadow: true,
        });
        ground.add(new Body());
        ground.add(new Plane());

        light.get(Transform).look(Vector3.ZERO);

        for (let index = 0; index < 50; index++) {
            this.addEntities(this.createBox(index));
        }


        this.addEntities(light,camera, ground);
        this.addSystem(new FreeRoamCameraSystem());
    }
}



const engine = new ThreeEngine(new RenderSystem({ color: 0x262626,configure: (renderer, scene) => {
    renderer.setPixelRatio(2);
	renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.shadowMap.enabled = true;

    scene.fog = new Fog(
        0x262626,
        10,
        200
    )
} }));

engine.registerSpaces(new AnimationSpace(engine));

engine.getSpace('animation').open();

console.log('🎉 Client');

