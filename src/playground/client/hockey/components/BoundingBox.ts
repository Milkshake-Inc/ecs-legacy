import Vector2 from "@ecs/math/Vector2";

export default class BoundingBox {
	constructor(
        public size: Vector2 = Vector2.ONE
    ) {}
}