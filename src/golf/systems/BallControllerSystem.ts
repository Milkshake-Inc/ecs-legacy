import { Entity } from "@ecs/ecs/Entity";
import { useQueries } from "@ecs/ecs/helpers";
import { IterativeSystem } from "@ecs/ecs/IterativeSystem";
import Key from "@ecs/input/Key";
import Keyboard from "@ecs/input/Keyboard";
import Vector3 from "@ecs/math/Vector";
import CannonBody from "@ecs/plugins/physics/components/CannonBody";
import { ToCannonVector3, ToThreeVector3 } from "@ecs/plugins/physics/utils/Conversions";
import Transform from "@ecs/plugins/Transform";
import { all, makeQuery } from "@ecs/utils/QueryHelper";
import { PerspectiveCamera, ArrowHelper, Euler } from "three";
import PlayerBall from "../components/PlayerBall";
import { Graphics } from "pixi.js";
import { Engine } from "@ecs/ecs/Engine";
import Color from "@ecs/math/Color";
import MathHelper from "@ecs/math/MathHelper";

export class BallControllerSystem extends IterativeSystem {

    protected keyboard: Keyboard;

    protected queries = useQueries(this, {
        camera: all(PerspectiveCamera)
    })

    graphics: Graphics;
    power = 0;

    directionLine: Entity;

    constructor() {
        super(makeQuery(all(Transform, PlayerBall, CannonBody)));
        console.log("Created")
        this.keyboard = new Keyboard();
    }

    public onAddedToEngine(engine: Engine) {
        super.onAddedToEngine(engine);
        console.log("Added")
        const powerBar = new Entity();
        powerBar.add(Transform, {
            position: new Vector3(1280 / 2 - 200, 600)
        })
        powerBar.add(this.graphics = new Graphics())
        engine.addEntity(powerBar);

        this.directionLine = new Entity();
        this.directionLine.add(Transform);
        this.directionLine.add(new ArrowHelper(
            ToThreeVector3(Vector3.FORWARD),
            ToThreeVector3(Vector3.ZERO),
            10,
            0xff0050
        ))
        engine.addEntity(this.directionLine);
    }

    updateEntityFixed(entity: Entity, deltaTime: number) {

        const camera = this.queries.camera.first;

        const cameraTransform = camera.get(Transform);
        const characterTransform = entity.get(Transform);

        const directionVector = cameraTransform.position.sub(characterTransform.position).normalize();

        this.directionLine.get(Transform).position = characterTransform.position.clone();
        this.directionLine.get(Transform).rz = Math.PI / 2;
        this.directionLine.get(Transform).ry = -Math.atan2(directionVector.z, directionVector.x);

        // const helper = this.directionLine.get(ArrowHelper);
        // helper.setRotationFromEuler(new Euler(directionVector.x,directionVector.y, directionVector.z) )
        // helper.setLength(10);

        // console.log(ToThreeVector3(directionVector));


        if (camera) {

            if(this.keyboard.isPressed(Key.X)) {
                this.power = 1;
                entity.get(CannonBody).velocity.set(0, 0, 0);
                entity.get(CannonBody).angularVelocity.set(0, 0, 0);
            }

            if(this.keyboard.isDown(Key.X)) {
                this.power += 1.2;
                this.power = MathHelper.clamp(this.power, 0, 100);

                this.directionLine.get(ArrowHelper).setLength(this.power / 10);
            }

            if(this.keyboard.isReleased(Key.X)) {

                const mappedPower = MathHelper.map(0, 100, 1, 10, this.power);

                console.log(`Shot Power: ${mappedPower}`);

                const powerVector = directionVector.multiF(mappedPower);
                // entity.get(CannonBody).velocity.set(-directionVector.x, 0, -directionVector.z);
                entity.get(CannonBody).applyImpulse(
                    ToCannonVector3(new Vector3(-powerVector.x, 0, -powerVector.z)),
                    ToCannonVector3(Vector3.ZERO),
                );
            }
		}

        this.keyboard.update();

        this.drawPowerBar();
    }

    drawPowerBar() {
        this.graphics.clear();
        this.graphics.beginFill(Color.White);
        this.graphics.drawRect(0, 0, 400, 50);

        this.graphics.beginFill(Color.Gray);
        this.graphics.drawRect(5, 5, 400 - 10, 50 - 10);

        this.graphics.beginFill(0xff0050);
        const width = ((400 - 10) / 100 * this.power);
        this.graphics.drawRect(5, 5, width, 50 - 10);

        const quater = ((400 - 10) / 100 * 25);
        this.graphics.beginFill(Color.White);
        this.graphics.drawRect(5 + quater, 5, 2, 50 - 10);

        const half = ((400 - 10) / 100 * 50);
        this.graphics.beginFill(Color.White);
        this.graphics.drawRect(5 + half, 5, 2, 50 - 10);

        const threequater = ((400 - 10) / 100 * 75);
        this.graphics.beginFill(Color.White);
        this.graphics.drawRect(5 + threequater, 5, 2, 50 - 10);
    }
}