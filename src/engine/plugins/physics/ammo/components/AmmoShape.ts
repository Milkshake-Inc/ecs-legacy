import { AmmoInstance } from "../AmmoPhysicsSystem";
import Ammo from "ammojs-typed";
import { Vector } from "@ecs/plugins/math/Vector";

export default class AmmoShape {

    public shape: Ammo.btCollisionShape;

    constructor(shape: Ammo.btCollisionShape) {
        this.shape = shape;
    }

    public static BOX(size: number | Vector) {
        if(typeof size == "number") {
            return new AmmoShape(new AmmoInstance.btBoxShape(
                new AmmoInstance.btVector3(size, size, size)
            ));
        }

        return new AmmoShape(
            new AmmoInstance.btBoxShape(new AmmoInstance.btVector3(size.x, size.y, size.z))
        )
    }

    public static SPHERE(radius: number) {
        return new AmmoShape(new AmmoInstance.btSphereShape(radius))
    }
}