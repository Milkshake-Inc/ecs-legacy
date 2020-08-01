import AmmoBody from "../components/AmmoBody";
import { all } from "@ecs/ecs/Query";
import AmmoPlane from "../components/AmmoPlane";
import { useAmmoCouple } from "./AmmoCouple";
import { System } from "@ecs/ecs/System";
import { AmmoInstance } from "../AmmoPhysicsSystem";

export const useAmmoPlaneCouple = (system: System) => useAmmoCouple(system, all(AmmoBody, AmmoPlane), {
	onCreate: (entity) => {
		const groundShape = new AmmoInstance.btBoxShape(new AmmoInstance.btVector3(100, 0.5, 100));
		const groundTransform = new AmmoInstance.btTransform();
		groundTransform.setIdentity();

		groundTransform.setOrigin(new AmmoInstance.btVector3(0, -0.5, 0));
		const groundMass = 0;
		const groundLocalInertia = new AmmoInstance.btVector3(0, 0, 0);
		const groundMotionState = new AmmoInstance.btDefaultMotionState(groundTransform);
		const body = new AmmoInstance.btRigidBody(
			new AmmoInstance.btRigidBodyConstructionInfo(groundMass, groundMotionState, groundShape, groundLocalInertia)
		);
		body.setRestitution(1);
		return body;
	},
})