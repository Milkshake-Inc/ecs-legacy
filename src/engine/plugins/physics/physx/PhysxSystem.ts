import { System } from '@ecs/ecs/System';
import physx from 'physx-js';
import { PlatformHelper } from '@ecs/plugins/tools/Platform';

let PhysX = null;

export class PhysxSystem extends System {
	private physics: any;
	private scene: any;
	private bodies = [];

	constructor() {
		super();

		const instance = physx({
			locateFile(path) {
				if (path.endsWith('.wasm')) {
					return PlatformHelper.IsClient()
						? 'https://cdn.jsdelivr.net/npm/physx-js/dist/physx.release.wasm' // maybe just load from our own assets folder...
						: 'node_modules/physx-js/dist/physx.release.wasm';
				}
				return path;
			},
			onRuntimeInitialized: () => {
				PhysX = instance;
				this.setup();
			}
		});
	}

	setup() {
		const version = PhysX.PX_PHYSICS_VERSION;
		console.log(version);
		const defaultErrorCallback = new PhysX.PxDefaultErrorCallback();
		const allocator = new PhysX.PxDefaultAllocator();
		const foundation = PhysX.PxCreateFoundation(version, allocator, defaultErrorCallback);

		const triggerCallback = {
			onContactBegin: () => {
				console.log('contact', ...arguments);
			},
			onContactEnd: () => {},
			onContactPersist: () => {},
			onTriggerBegin: () => {},
			onTriggerEnd: () => {}
		};

		const physxSimulationCallbackInstance = PhysX.PxSimulationEventCallback.implement(triggerCallback);

		this.physics = PhysX.PxCreatePhysics(version, foundation, new PhysX.PxTolerancesScale(), false, null);
		PhysX.PxInitExtensions(this.physics, null);
		const sceneDesc = PhysX.getDefaultSceneDesc(this.physics.getTolerancesScale(), 0, physxSimulationCallbackInstance);
		this.scene = this.physics.createScene(sceneDesc);

		const geometry = new PhysX.PxBoxGeometry(1, 1, 1); // Physx uses half extents (divide all scaling by 2)

		const flags = new PhysX.PxShapeFlags(PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value | PhysX.PxShapeFlag.eSIMULATION_SHAPE.value);
		const material = this.physics.createMaterial(0.2, 0.2, 0.2);
		const shape = this.physics.createShape(geometry, material, false, flags);
		const transform = {
			translation: {
				x: 50,
				y: 50,
				z: 50
			},
			rotation: {
				w: 1, // PhysX uses WXYZ quaternions,
				x: 0,
				y: 0,
				z: 0
			}
		};

		const body = this.physics.createRigidDynamic(transform);
		body.attachShape(shape);
		this.scene.addActor(body, null);
		this.bodies.push(body);
	}

	update(dt) {
		if (this.scene) {
			this.scene.simulate(1 / 60, true);
			this.scene.fetchResults(true);

			this.bodies.forEach(b => {
				const transform = b.getGlobalPose();
				console.log(transform.translation);
			});
		}
	}
}
