import { Engine } from '@ecs/ecs/Engine';
import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import Space from '@ecs/plugins/space/Space';
import { LoadGLTF, LoadTexture } from '@ecs/utils/ThreeHelper';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh, PlaneGeometry, MeshBasicMaterial, PerspectiveCamera, MeshPhongMaterial, DirectionalLight, Color as ThreeColor, Vector3 as ThreeVector3, BoxGeometry, TextureLoader, RepeatWrapping, Texture, AmbientLight } from 'three';
import Transform from '@ecs/plugins/Transform';
import { Entity } from '@ecs/ecs/Entity';
import ThirdPersonCameraSystem from 'src/ship/systems/ThirdPersonCameraSystem';
import Color from '@ecs/math/Color';
import Vector3 from '@ecs/math/Vector';
import RenderSystem from '@ecs/plugins/3d/systems/RenderSystem';
import { useQueries } from '@ecs/ecs/helpers';
import { Body, Box, Vec3, Plane } from 'cannon';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import MeshShape from '@ecs/plugins/physics/components/MeshShape';
import Random from '@ecs/math/Random';
import { System } from '@ecs/ecs/System';
import { makeQuery, all } from '@ecs/utils/QueryHelper';
import Keyboard from '@ecs/input/Keyboard';
import Key from '@ecs/input/Key';

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
        this.addSystem(new CannonPhysicsSystem(new Vector3(0, -10, 0), 10, false));

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
        this.addSystem(new MouseSystem());
    }
}

class MouseSystem extends System {

    private lastPosition = {
        x: 0,
        y: 0
    };

    private cameraAngle: Vector3 = Vector3.ZERO;
    private keyboard = new Keyboard();

    protected queries = useQueries(this, {
        camera: all(PerspectiveCamera)
    });

    constructor() {
        super();

        window.addEventListener("mousemove", this.handleMouseMove.bind(this));
    }

    handleMouseMove(event: MouseEvent) {
        const mouse = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1

        }

        const delta = {
            x: mouse.x - this.lastPosition.x,
            y: mouse.y - this.lastPosition.y,
        }

        this.cameraAngle.x += delta.y;
        this.cameraAngle.y -= delta.x;

        const camera = this.queries.camera.first.get(Transform);

        // camera.rx += delta.y;
        camera.quaternion.setFromEuler(this.cameraAngle);

        this.lastPosition = mouse;
    }

    public update(deltaTime: number) {
        const camera = this.queries.camera.first.get(Transform);

        if(this.keyboard.isDown(Key.W)) {
            camera.position.z -= 0.1;
        }

        if(this.keyboard.isDown(Key.S)) {
            camera.position.z += 0.1;
        }

        if(this.keyboard.isDown(Key.A)) {
            camera.position.x -= 0.1;
        }

        if(this.keyboard.isDown(Key.D)) {
            camera.position.x += 0.1;
        }
    }
}

const engine = new ThreeEngine(new RenderSystem(1280, 720, 0x262626));

engine.registerSpaces(new AnimationSpace(engine));

engine.getSpace('animation').open();

console.log('🎉 Client');

