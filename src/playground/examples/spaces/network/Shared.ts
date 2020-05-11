import { Entity } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { System } from '@ecs/ecs/System';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import Boat from '@ecs/plugins/vehicle/components/Boat';
import { all, any, makeQuery, not } from '@ecs/utils/QueryHelper';

export class Player {}

export const snapshotUseQuery = (system: System) => {
	return useQueries(system, {
		boats: all(Boat),
		players: all(Player),
		sessions: all(Session)
	});
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

export type PhysicSnapshot = number[];

export type Snapshot = {
	boat: PhysicSnapshot;
	players: { id: string; snap: PhysicSnapshot }[];
};
