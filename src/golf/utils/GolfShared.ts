import { all, makeQuery, any, not } from '@ecs/utils/QueryHelper';
import PlayerBall from '../components/PlayerBall';
import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Entity } from '@ecs/ecs/Entity';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import { Player } from '../components/Player';
import GolfPlayer from '../components/GolfPlayer';

export const snapshotUseQuery = (system: System) => {
	return useQueries(system, {
		players: all(GolfPlayer)
	});
};

export type PhysicSnapshot = number[];

export type Snapshot = {
	balls: { id: string; snap: PhysicSnapshot }[];
};

export class PlayerSpawnSystem extends IterativeSystem {
	private playerGenerator: (entity: Entity, local: boolean) => void;

	constructor(playerGenerator: (entity: Entity, local: boolean) => void) {
		super(makeQuery(any(Session, RemoteSession), not(Player)));
		this.playerGenerator = playerGenerator;
	}

	updateEntity(entity: Entity) {
		this.playerGenerator(entity, entity.has(Session));
		entity.add(Player);
	}
}
