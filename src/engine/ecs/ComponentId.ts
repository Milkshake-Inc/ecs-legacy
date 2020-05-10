import { Class } from '../utils/Class';

const componentIds = new Map<string, number>();

/**
 * Gets an id for a component class.
 *
 * @param component Component class
 * @param createIfNotExists If defined - will create unique id for class component, if it's not defined before
 */
export function getComponentId<T>(component: Class<T>, createIfNotExists = false): number | undefined {
	if (component == undefined) return undefined;

	const className = component.prototype.constructor.name;
	if (componentIds.has(className)) {
		return componentIds.get(className);
	} else if (createIfNotExists) {
		componentIds.set(className, componentClassId++);
		return componentIds.get(className);
	}

	return undefined;
}

let componentClassId = 1;
