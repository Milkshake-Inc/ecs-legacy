import AmmoBody from "../components/AmmoBody";
import { all } from "@ecs/ecs/Query";
import { useAmmoCouple } from "./AmmoCouple";
import { System } from "@ecs/ecs/System";
import { AmmoInstance } from "../AmmoPhysicsSystem";
import Transform from "@ecs/plugins/math/Transform";
import AmmoSphere from "../components/AmmoSphere";
import Ammo from "ammojs-typed";

export const useAmmoSphereCouple = (system: System) => useAmmoCouple(system, all(AmmoBody, AmmoSphere), {
	onCreate: (entity) => {
		const { position, quaternion } = entity.get(Transform);
		const { size } = entity.get(AmmoSphere);

		const shape = new AmmoInstance.btSphereShape(size);
		shape.setMargin(0.05);

		const localInertia = new AmmoInstance.btVector3(0, 0, 0);
		shape.calculateLocalInertia(1, localInertia);

		const transform = new AmmoInstance.btTransform();
		transform.setIdentity();
		transform.setOrigin(new AmmoInstance.btVector3(position.x, position.y, position.z));
		transform.setRotation(new AmmoInstance.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

		const motionState = new AmmoInstance.btDefaultMotionState(transform);
		const rbInfo = new AmmoInstance.btRigidBodyConstructionInfo(1, motionState, shape, localInertia);
		const body = new AmmoInstance.btRigidBody(rbInfo);

		// body.setFriction(2000);
		// body.setRollingFriction(20000);
		body.setDamping(0.15, 0);
		body.setRestitution(0.7);

		body.setCcdMotionThreshold(1);
		body.setCcdSweptSphereRadius(size)

		return body;
	},
	onUpdate: (entity, couple: Ammo.btRigidBody) => {
		const ammoTransform = couple.getWorldTransform();
		const ammoPosition = ammoTransform.getOrigin();
		const ammoRotation = ammoTransform.getRotation();

		const transform = entity.get(Transform);
		// console.log("Update sphere");
		transform.position.set(
			ammoPosition.x(),
			ammoPosition.y(),
			ammoPosition.z()
		)

		transform.quaternion.set(
			ammoRotation.x(),
			ammoRotation.y(),
			ammoRotation.z(),
			ammoRotation.w()
		)
	}
})
