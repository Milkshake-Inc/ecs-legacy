import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Session from '@ecs/plugins/net/components/Session';
import { any, makeQuery, not } from '@ecs/ecs/Query';
import { Player } from '../components/Player';

export class PlayerSpawnSystem extends IterativeSystem {
	private playerGenerator: (entity: Entity, local: boolean) => void;

	constructor(playerGenerator: (entity: Entity, local: boolean) => void) {
		super(makeQuery(any(Session), not(Player)));
		this.playerGenerator = playerGenerator;
	}

	updateEntity(entity: Entity) {
		this.playerGenerator(entity, entity.has(Session));
		entity.add(Player);
	}
}
