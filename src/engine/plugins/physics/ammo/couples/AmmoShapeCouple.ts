import AmmoBody from "../components/AmmoBody";
import { all } from "@ecs/ecs/Query";
import { useAmmoCouple, genericAmmoTransformUpdate } from "./AmmoCouple";
import { System } from "@ecs/ecs/System";
import { AmmoInstance } from "../AmmoPhysicsSystem";
import Transform from "@ecs/plugins/math/Transform";
import Ammo from "ammojs-typed";
import AmmoShape from "../components/AmmoShape";

export const useAmmoShapeCouple = (system: System) => useAmmoCouple(system, all(AmmoBody, AmmoShape), {
	onCreate: (entity) => {
		const { position, quaternion } = entity.get(Transform);
		const { mass } = entity.get(AmmoBody);
		const { shape } = entity.get(AmmoShape);

		// TODO Not sure if needed?
		shape.setMargin(0.05);

		const localInertia = new AmmoInstance.btVector3(0, 0, 0);
		shape.calculateLocalInertia(mass, localInertia);

		const transform = new AmmoInstance.btTransform();
		transform.setIdentity();
		transform.setOrigin(new AmmoInstance.btVector3(position.x, position.y, position.z));
		transform.setRotation(new AmmoInstance.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

		const motionState = new AmmoInstance.btDefaultMotionState(transform);
		const rbInfo = new AmmoInstance.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
		const body = new AmmoInstance.btRigidBody(rbInfo);

		// body.setRollingFriction(2);
		// body.setFriction(1);

		// body.setFriction(2000);
		// body.setRollingFriction(20000);

		// body.setDamping(0.15, 0);
		// body.setRestitution(0.7);

		body.setCcdMotionThreshold(0.1);
		body.setCcdSweptSphereRadius(0.05)

		return body;
	},
	onUpdate: (entity, couple: Ammo.btRigidBody) => {
		genericAmmoTransformUpdate(entity, couple);
	}
})
