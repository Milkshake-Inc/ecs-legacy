export default PhysX;

declare namespace PhysX {
	type PhysXVersion = number;
	const PX_PHYSICS_VERSION: PhysXVersion;
	class PxDefaultErrorCallback {}
	class PxDefaultAllocator {}
	function PxCreateFoundation(version: PhysXVersion, allocator: PxDefaultErrorCallback, errorCallback: PxDefaultAllocator);
}

// declare function PhysX<T>(target?: T): Promise<T & typeof PhysX>;
