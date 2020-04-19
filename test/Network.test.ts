import { Engine } from "@ecs/ecs/Engine"
import PhysicsSystem from "@ecs/plugins/physics/systems/PhysicsSystem";
import Position from "@ecs/plugins/Position";
import PhysicsBody from "@ecs/plugins/physics/components/PhysicsBody";
import { Entity } from "@ecs/ecs/Entity";
import { encode, decode } from "@msgpack/msgpack";

type Snapshot = {
    x: number;
    y: number;
    vX: number;
    vY: number;
};

test('Test encode & decode handles big floats', () => {
    const testNumber = 404.82512673922685;
    expect(decode(encode(testNumber))).toBe(testNumber);
})

test('Simple physics revert via snapshots', () => {
    const engine = new Engine();

    engine.addSystem(new PhysicsSystem());

    const box = new Entity();
    box.add(Position, { x: 1280 / 2, y: 720 / 2 });
    box.add(PhysicsBody.rectangle(40, 40));
    engine.addEntity(box);

    const takeSnapshot = (): Snapshot => {
        const physicsBody = box.get(PhysicsBody);

        return {
            x: physicsBody.position.x,
            y: physicsBody.position.y,
            vX: physicsBody.velocity.x,
            vY: physicsBody.velocity.y,
        };
    }

    const applySnapshot = (snapshot: Snapshot) => {
        const physicsBody = box.get(PhysicsBody);

        physicsBody.position = {
            x: snapshot.x,
            y: snapshot.y
        };

        physicsBody.velocity = {
            x: snapshot.vX,
            y: snapshot.vY
        };
    }

    engine.updateFixed(16);

    const snapshotA = takeSnapshot();

    engine.updateFixed(16);

    const snapshotAUpdated = takeSnapshot();

    expect(snapshotA).not.toMatchObject(takeSnapshot());

    applySnapshot(snapshotA);

    expect(takeSnapshot()).toMatchObject(snapshotA);

    engine.updateFixed(16);


    expect(takeSnapshot()).toMatchObject(snapshotAUpdated);
})