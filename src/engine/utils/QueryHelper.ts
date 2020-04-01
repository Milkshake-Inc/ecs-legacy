import { Entity } from '../ecs/Entity';
import { Query } from '../ecs/Query';
import { Class } from './Class';

type QueryPattern = (entity: Entity) => boolean;

export const all = (...components: Class<any>[]): QueryPattern => {
	return (entity: Entity) => {
		for (let component of components) {
			if (!entity.has(component)) {
				return false;
			}
		}

		return true;
	};
};

export const any = (...components: Class<any>[]): QueryPattern => {
	return (entity: Entity) => {
		for (let component of components) {
			if (entity.has(component)) {
				return true;
			}
		}

		return false;
	};
};

export const not = (...components: Class<any>[]): QueryPattern => {
	return (entity: Entity) => {
		for (let component of components) {
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
