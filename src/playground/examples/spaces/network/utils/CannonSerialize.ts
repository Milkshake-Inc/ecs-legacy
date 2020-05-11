import CannonBody from '@ecs/plugins/physics/components/CannonBody';

export const serialize = (cannonBody: CannonBody): number[] => {
	return [
		// Position
		cannonBody.position.x,
		cannonBody.position.y,
		cannonBody.position.z,
		cannonBody.previousPosition.x,
		cannonBody.previousPosition.y,
		cannonBody.previousPosition.z,
		cannonBody.interpolatedPosition.x,
		cannonBody.interpolatedPosition.y,
		cannonBody.interpolatedPosition.z,
		cannonBody.initPosition.x,
		cannonBody.initPosition.y,
		cannonBody.initPosition.z,

		// Orientation
		cannonBody.quaternion.x,
		cannonBody.quaternion.y,
		cannonBody.quaternion.z,
		cannonBody.quaternion.w,
		cannonBody.previousQuaternion.x,
		cannonBody.previousQuaternion.y,
		cannonBody.previousQuaternion.z,
		cannonBody.previousQuaternion.w,
		cannonBody.interpolatedQuaternion.x,
		cannonBody.interpolatedQuaternion.y,
		cannonBody.interpolatedQuaternion.z,
		cannonBody.interpolatedQuaternion.w,
		cannonBody.initQuaternion.x,
		cannonBody.initQuaternion.y,
		cannonBody.initQuaternion.z,
		cannonBody.initQuaternion.w,

		// Velocity
		cannonBody.velocity.x,
		cannonBody.velocity.y,
		cannonBody.velocity.z,
		cannonBody.initVelocity.x,
		cannonBody.initVelocity.y,
		cannonBody.initVelocity.z,
		cannonBody.angularVelocity.x,
		cannonBody.angularVelocity.y,
		cannonBody.angularVelocity.z,
		cannonBody.initAngularVelocity.x,
		cannonBody.initAngularVelocity.y,
		cannonBody.initAngularVelocity.z,

		cannonBody.force.x,
		cannonBody.force.y,
		cannonBody.force.z,
		cannonBody.torque.x,
		cannonBody.torque.y,
		cannonBody.torque.z
	];
};

export const deserialize = (cannonBody: CannonBody, data: number[]) => {
	cannonBody.position.set(data[0], data[1], data[2]);
	cannonBody.previousPosition.set(data[3], data[4], data[5]);
	cannonBody.interpolatedPosition.set(data[6], data[7], data[8]);
	cannonBody.initPosition.set(data[9], data[10], data[11]);

	// orientation
	cannonBody.quaternion.set(data[12], data[13], data[14], data[15]);
	cannonBody.previousQuaternion.set(data[16], data[17], data[18], data[19]);
	cannonBody.interpolatedQuaternion.set(data[20], data[21], data[22], data[23]);
	cannonBody.initQuaternion.set(data[24], data[25], data[26], data[27]);

	// Velocity
	cannonBody.velocity.set(data[28], data[29], data[30]);
	cannonBody.initVelocity.set(data[31], data[32], data[33]);
	cannonBody.angularVelocity.set(data[34], data[35], data[36]);
	cannonBody.initAngularVelocity.set(data[37], data[38], data[39]);

	// Force
	cannonBody.force.set(data[40], data[41], data[42]);
	cannonBody.torque.set(data[43], data[44], data[45]);
};
