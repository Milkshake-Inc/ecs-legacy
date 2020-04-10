import { makeQuery, all, not } from '@ecs/utils/QueryHelper';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Session from '@ecs/plugins/net/components/Session';
import { Entity } from '@ecs/ecs/Entity';
import { Player } from '../components/Player';

export default class PlayerSpawnSystem extends IterativeSystem {
	private playerGenerator: (entity: Entity) => void;

	constructor(playerGenerator: (entity: Entity) => void) {
		super(makeQuery(all(Session), not(Player)));
		this.playerGenerator = playerGenerator;
	}

	updateEntity(entity: Entity) {
		this.playerGenerator(entity);
		entity.add(Player);
	}
}
