declare module '*.wasm' {
	const value: any;
	export = value;
}

declare namespace PhysX {
	interface PxShapeFlag {
		eSIMULATION_SHAPE: {
			value: number;
		};
		eSCENE_QUERY_SHAPE: {
			value: number;
		};
		eTRIGGER_SHAPE: {
			value: number;
		};
		eVISUALIZATION: {
			value: number;
		};
	}

	type Constructor<T = {}> = new (...args: any[]) => T;
	type VoidPtr = number;
	const NULL: {};
	const HEAPF32: Float32Array;
	function destroy(obj: PhysX.Type): void;
	function castObject<T1, T2 extends PhysX.Type>(obj: T1, fun: Constructor<T2>): T2;
	function wrapPointer<T extends PhysX.Type>(params: number, obj: Constructor<T>): T;
	function addFunction(params: Function): number;
	function getClass(obj: PhysX.Type): void;
	function getPointer(obj: PhysX.Type): void;
	function getCache(fun: Constructor<PhysX.Type>): void;
	function _malloc(byte: number): number;
	function _free(...args: any): any;
	function compare(obj1: PhysX.Type, obj2: PhysX.Type): boolean;

	class GeometryType {
		Enum: {
			eSPHERE: number;
			ePLANE: number;
			eCAPSULE: number;
			eBOX: number;
			eCONVEXMESH: number;
			eTRIANGLEMESH: number;
			eHEIGHTFIELD: number;
			eGEOMETRY_COUNT: number; //!< internal use only!
			eINVALID: number; //= -1		//!< internal use only!
		};
	}

	const PX_PHYSICS_VERSION: number;
	interface PxAllocatorCallback {}
	class PxDefaultErrorCallback implements PxAllocatorCallback {}
	interface PxErrorCallback {}
	class PxDefaultAllocator implements PxErrorCallback {}

	class PxFoundation {}
	function PxCreateFoundation(a: number, b: PxAllocatorCallback, c: PxErrorCallback): PxFoundation;

	class PxTransform {
		constructor(p: number[], q: number[]);
		constructor();
		setPosition(t: number[]): void;
		getPosition(): number[];
		setQuaternion(t: number[]): void;
		getQuaternion(): number[];

		translation: {
			x: number;
			y: number;
			z: number;
		};
		rotation: {
			x: number;
			y: number;
			z: number;
			w: number;
		};
	}

	class ClassHandle {
		count: { value: number };
		ptr: number;
	}

	class Base {
		$$: ClassHandle;
	}

	class PxGeometry {
		getType(): number;
	}
	class PxBoxGeometry extends PxGeometry {
		constructor(x: number, y: number, z: number);
	}
	class PxSphereGeometry extends PxGeometry {
		constructor(r: number);
	}
	class PxPlaneGeometry extends PxGeometry {
		constructor();
	}
	class PxTriangleMesh extends PxGeometry {
		constructor(x: number, y: number, z: number);
	}

	class Material extends Base {}

	class PxShape extends Base {
		setContactOffset(contactOffset: number): void;
	}

	class PxActorFlags {
		constructor(value: number);
	}

	class Actor extends Base {
		setActorFlag(flag: number, value: boolean): void;
		setActorFlags(flags: PxActorFlags): void;
		getActorFlags(): number;
		getGlobalPose(): PxTransform;
		setGlobalPose(transform: PxTransform, autoAwake: boolean): void;
		setLinearVelocity(value: PxVec3, autoAwake: boolean): void;
		addImpulseAtLocalPos(valueA: PxVec3, valueB: PxVec3): void;
	}
	class RigidActor extends Actor {
		attachShape(shape: PxShape): void;
		detachShape(shape: PxShape, wakeOnLostTouch?: boolean | true): void;
		addForce(force: PxVec3 | any, mode: PxForceMode | number, autowake: boolean): void;
	}
	enum PxForceMode {}
	class RigidBody extends RigidActor {
		setRigidBodyFlag(flag: PxRigidBodyFlags, value: boolean): void;
		setRigidBodyFlags(flags: PxRigidBodyFlags): void;
		getRigidBodyFlags(): number;

		setMass(value: number): void;
		getMass(): number;
	}

	class RigidStatic extends RigidActor {}
	class RigidDynamic extends RigidBody {
		wakeUp(): void; //, &PxRigidDynamic::wakeUp)
		setWakeCounter(): void; //, &PxRigidDynamic::setWakeCounter)
		isSleeping(): boolean; //, &PxRigidDynamic::isSleeping)
		getWakeCounter(): void; //, &PxRigidDynamic::getWakeCounter)
		setSleepThreshold(value: number): void; //, &PxRigidDynamic::setSleepThreshold)
		getSleepThreshold(): number; //, &PxRigidDynamic::getSleepThreshold)
		setKinematicTarget(): void; //, &PxRigidDynamic::setKinematicTarget)
		setRigidDynamicLockFlags(): void; //, &PxRigidDynamic::setRigidDynamicLockFlags);
		setSolverIterationCounts(minPositionIters: number, minVelocityIters: number): void;

		setAngularVelocity(value: PxVec3, autoWake: boolean): void;
		setAngularDamping(value: number): void;
	}
	class PxVec3 {}

	class PxSceneDesc {}
	class PxScene {
		addActor(actor: Actor, unk: any): void;
		simulate(timeStep: number, rando: boolean): void;
		fetchResults(b: boolean): void;
		getActiveActors(len: number): Actor[];
	}

	class PxCookingParams {
		constructor(scale: PxTolerancesScale);
		public meshPreprocessParams: number;
	}

	class PxMeshScale {
		constructor(a: any, b: any);
	}

	class PxShapeFlags {
		constructor(flags: PxShapeFlag | number);
	}

	class PxRigidBodyFlags {
		constructor(flags: number);
	}

	class PxTriangleMeshGeometry {
		constructor(a: any, b: any, c: any);
	}

	class PxMeshGeometryFlags {
		constructor(a: any);
	}

	class PxCooking {
		createTriMesh(
			verticesPtr: number,
			vertCount: number,
			indicesPrt: number,
			indexCount: number,
			isU16: boolean,
			physcis: PxPhysics
		): void;
	}

	class PxPhysics {
		createSceneDesc(): PxSceneDesc;
		createScene(a: PxSceneDesc): PxScene;
		createRigidDynamic(a: PxTransform | any): RigidDynamic;
		createRigidStatic(a: PxTransform | any): RigidStatic;
		createMaterial(staticFriction: number, dynamicFriction: number, restitution: number): Material;
		//shapeFlags = PxShapeFlag:: eVISUALIZATION | PxShapeFlag:: eSCENE_QUERY_SHAPE | PxShapeFlag:: eSIMULATION_SHAPE
		createShape(geometry: PxGeometry, material: Material, isExclusive?: boolean | false, shapeFlags?: number | PxShapeFlags): PxShape;
		getTolerancesScale();
	}
	class PxTolerancesScale {
		length: number | 1.0;
		speed: number | 10.0;
	}
	class PxPvd {}
	function PxCreatePhysics(
		a?: number,
		b?: PxFoundation,
		c?: PxTolerancesScale,
		trackOutstandingAllocations?: boolean,
		e?: PxPvd
	): PxPhysics;
	function PxCreateCooking(version: number, foundation: PxFoundation, params: PxCookingParams): PxCooking;

	type Type = {};

	const HEAPU16: Uint16Array;
	const HEAPU32: Uint32Array;
}

declare function PhysX(): Promise<typeof PhysX>;
