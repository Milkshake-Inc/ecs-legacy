import { Entity } from '../ecs/Entity';
import { Query } from '../ecs/Query';
import { Class } from './Class';
import { Events } from '@ecs/ecs/helpers/StatefulSystems';

export type QueryPattern = (entity: Entity) => boolean;

export const event = (eventType: string): QueryPattern => {
	return (entity: Entity) => {
		if (entity.has(Events)) {
			const { events } = entity.get(Events);
			for (const event of events) {
				if (event.type == eventType) return true;
			}
		}

		return false;
	};
};

export const all = (...components: Class<any>[]): QueryPattern => {
	return (entity: Entity) => {
		for (const component of components) {
			if (!entity.has(component)) {
				return false;
			}
		}

		return true;
	};
};

export const any = (...components: Class<any>[]): QueryPattern => {
	return (entity: Entity) => {
		for (const component of components) {
			if (entity.has(component)) {
				return true;
			}
		}

		return false;
	};
};

export const not = (...components: Class<any>[]): QueryPattern => {
	return (entity: Entity) => {
		for (const component of components) {
			if (entity.has(component)) {
				return false;
			}
		}

		return true;
	};
};

export const makeQuery = (...patterns: QueryPattern[]) => {
	return new Query(entity => {
		for (const pattern of patterns) {
			if (!pattern(entity)) return false;
		}

		return true;
	});
};
