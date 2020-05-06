import { Entity } from '@ecs/ecs/Entity';

export default class Vehicle {
	constructor(public controller: Entity = null) {}
}
