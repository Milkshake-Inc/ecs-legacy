import Ammo from "ammojs-typed";
import { AmmoInstance } from "../AmmoPhysicsSystem";
import { Vector } from "@ecs/plugins/math/Vector";

// TODO
// Maybe we should extend Ammo.btRigidBody?
export default class AmmoBody {
    body: Ammo.btRigidBody;
    ghost: boolean;
    mass = 1;
    linearDamping = 0;
    restitution = 0;

    public get moving() {
        return this.body.getLinearVelocity().length() > 0
    }

    public clearForces() {
        this.body.clearForces();
        this.body.setLinearVelocity(new AmmoInstance.btVector3(0, 0, 0))
        this.body.setAngularVelocity(new AmmoInstance.btVector3(0, 0, 0))
    }

    public setPosition(vector: Vector) {
        this.body.activate(true);

        this.body.getWorldTransform().setOrigin(new AmmoInstance.btVector3(
            vector.x,
            vector.y,
            vector.z,
        ));
    }

    public applyCentralImpulse(vector: Vector) {
        this.body.activate(true);

		this.body.applyCentralImpulse(
			new AmmoInstance.btVector3(vector.x, vector.y, vector.z)
		)
    }
}