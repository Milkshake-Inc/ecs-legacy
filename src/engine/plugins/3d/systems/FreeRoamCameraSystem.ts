import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Key from '@ecs/input/Key';
import Keyboard from '@ecs/input/Keyboard';
import Vector3 from '@ecs/math/Vector';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { PerspectiveCamera } from 'three';

export default class FreeRoamCameraSystem extends System {

    private lastPosition = { x: 0, y: 0 };
    private cameraAngle: Vector3 = Vector3.ZERO;
    private keyboard = new Keyboard();

    protected queries = useQueries(this, {
        camera: all(Transform, PerspectiveCamera)
    });

    constructor() {
        super();

        window.addEventListener("mousemove", this.handleMouseMove.bind(this));
    }

    get camera() {
        return this.queries.camera.first.get(Transform);
    }

    handleMouseMove(event: MouseEvent) {
        const mouse = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
        }

        const delta = {
            x: mouse.x - this.lastPosition.x,
            y: mouse.y - this.lastPosition.y,
        }

        this.cameraAngle.x += delta.x * 2;
        this.cameraAngle.y -= delta.y * 2;

        this.camera.quaternion.setFromAxisAngle(Vector3.UP, -this.cameraAngle.x)
        this.camera.quaternion.multiplyFromAxisAngle(Vector3.LEFT, this.cameraAngle.y)

        this.lastPosition = mouse;
    }

    public update(deltaTime: number) {
        const camera = this.queries.camera.first.get(Transform);

        const speed = this.keyboard.isDown(Key.SHIFT) ? 0.4 : 0.1;
        let movement = Vector3.ZERO;

        if(this.keyboard.isDown(Key.W)) {
            movement = movement.add(camera.quaternion.multiV(Vector3.FORWARD));
        }

        if(this.keyboard.isDown(Key.S)) {
            movement = movement.add(camera.quaternion.multiV(Vector3.BACKWARD));
        }

        if(this.keyboard.isDown(Key.A)) {
            movement = movement.add(camera.quaternion.multiV(Vector3.LEFT));
        }

        if(this.keyboard.isDown(Key.D)) {
            movement = movement.add(camera.quaternion.multiV(Vector3.RIGHT));
        }

        if(this.keyboard.isDown(Key.E)) {
            movement = movement.add(camera.quaternion.multiV(Vector3.UP));
        }

        if(this.keyboard.isDown(Key.Q)) {
            movement = movement.add(camera.quaternion.multiV(Vector3.DOWN));
        }

        camera.position = camera.position.add(movement.multiF(speed));
    }
}