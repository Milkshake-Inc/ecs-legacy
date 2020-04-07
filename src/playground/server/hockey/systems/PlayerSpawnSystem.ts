import { makeQuery, all, not } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Session from '@ecs/plugins/net/components/Session';
import { Entity } from '@ecs/ecs/Entity';
import { Player } from '../components/Player';

export default class PlayerSpawnSystem extends IterativeSystem {
	private playerGenerator: (id: string) => Entity;

	constructor(playerGenerator: (id: string) => Entity) {
		super(makeQuery(all(Session), not(Player)));
		this.playerGenerator = playerGenerator;
	}

	updateEntity(entity: Entity) {
		const session = entity.get(Session);
		entity.copyFrom(this.playerGenerator(session.id));
		entity.add(session);
		entity.add(Player);
	}
}
