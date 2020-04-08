import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Position from '@ecs/plugins/Position';
import { all, any, makeQuery } from '@ecs/utils/QueryHelper';
import { Sound } from '../components/Sound';

export default class SoundSystem extends IterativeSystem {
	constructor() {
		super(makeQuery(all(Sound)));
	}

	entityAdded = (snapshot: EntitySnapshot) => {
		if (snapshot.has(Sound)) {
			const sound = snapshot.get(Sound);
		}
	};
}
