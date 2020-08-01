import AmmoBody from "../components/AmmoBody";
import { all } from "@ecs/ecs/Query";
import AmmoPlane from "../components/AmmoPlane";
import { useAmmoCouple } from "./AmmoCouple";
import { System } from "@ecs/ecs/System";
import { AmmoInstance } from "../AmmoPhysicsSystem";
import AmmoBox from "../components/AmmoBox";
import Transform from "@ecs/plugins/math/Transform";

export const useAmmoBoxCouple = (system: System) => useAmmoCouple(system, all(AmmoBody, AmmoBox), {
	onCreate: (entity) => {
        const { size } = entity.get(AmmoBox);
		const { position, quaternion } = entity.get(Transform);

		const boxShape = new AmmoInstance.btBoxShape(new AmmoInstance.btVector3(size, size, size));
		boxShape.setMargin(0.05);

        const transform = new AmmoInstance.btTransform();
		transform.setIdentity();
		transform.setOrigin(new AmmoInstance.btVector3(position.x, position.y, position.z));
        transform.setRotation(new AmmoInstance.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

		const groundMass = 0;
		const groundLocalInertia = new AmmoInstance.btVector3(0, 0, 0);
		const groundMotionState = new AmmoInstance.btDefaultMotionState(transform);
		const body = new AmmoInstance.btRigidBody(
			new AmmoInstance.btRigidBodyConstructionInfo(groundMass, groundMotionState, boxShape, groundLocalInertia)
		);

		return body;
	},
})