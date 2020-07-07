import { Entity } from "@ecs/ecs/Entity";
import Vector3 from "@ecs/math/Vector";
import Transform from "@ecs/plugins/Transform";
import CannonBody from "@ecs/plugins/physics/components/CannonBody";
import { FLOOR_MATERIAL } from "../constants/Materials";
import { Sphere } from "cannon-es";
import { Mesh, SphereGeometry, MeshPhongMaterial } from "three";
import Color from "@ecs/math/Color";

const BALL_SIZE = 0.02;

export const createBall = (position: Vector3 = Vector3.ZERO): Entity => {
    const entity = new Entity();
    entity.add(Transform, { position });
    entity.add(
        new CannonBody({
            mass: 1,
            material: FLOOR_MATERIAL
        })
    );
    entity.add(new Sphere(BALL_SIZE));

    return entity;
}

export const createBallClient = (position: Vector3 = Vector3.ZERO): Entity => {
    const entity = createBall(position)

    entity.add(
        new Mesh(
            new SphereGeometry(BALL_SIZE, 10, 10),
            new MeshPhongMaterial({
                color: Color.White,
                reflectivity: 0,
                specular: 0
            })
        ),
        { castShadow: true, receiveShadow: true }
    );

    return entity;
}
