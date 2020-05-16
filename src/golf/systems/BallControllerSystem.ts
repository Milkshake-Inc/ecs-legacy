import { Entity } from "@ecs/ecs/Entity";
import { useQueries } from "@ecs/ecs/helpers";
import { IterativeSystem } from "@ecs/ecs/IterativeSystem";
import Key from "@ecs/input/Key";
import Keyboard from "@ecs/input/Keyboard";
import Vector3 from "@ecs/math/Vector";
import CannonBody from "@ecs/plugins/physics/components/CannonBody";
import { ToCannonVector3 } from "@ecs/plugins/physics/utils/Conversions";
import Transform from "@ecs/plugins/Transform";
import { all, makeQuery } from "@ecs/utils/QueryHelper";
import { PerspectiveCamera } from "three";
import PlayerBall from "../components/PlayerBall";

export class BallControllerSystem extends IterativeSystem {

    protected keyboard: Keyboard;

    protected queries = useQueries(this, {
        camera: all(PerspectiveCamera)
    })

    constructor() {
        super(makeQuery(all(Transform, PlayerBall, CannonBody)));
        console.log("Created")
        this.keyboard = new Keyboard();
    }

    updateEntityFixed(entity: Entity, deltaTime: number) {

        const camera = this.queries.camera.first;

        if (camera) {
			const cameraTransform = camera.get(Transform);
			const characterTransform = entity.get(Transform);

			const directionVector = cameraTransform.position.sub(characterTransform.position).normalize().multiF(4);

            if(this.keyboard.isPressed(Key.X)) {
                console.log("Shooot");
                console.log(directionVector);
                entity.get(CannonBody).velocity.set(-directionVector.x, 0, -directionVector.z);
                // entity.get(CannonBody).applyImpulse(
                //     ToCannonVector3(new Vector3(-directionVector.x, 0, -directionVector.z)),
                //     ToCannonVector3(Vector3.ZERO),
                // );
            }
		}

        this.keyboard.update();
    }
}