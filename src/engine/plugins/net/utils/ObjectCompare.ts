export const objectIsEqual = (objectA: {}, objectB: {}) => {
	return JSON.stringify(objectA) == JSON.stringify(objectB);
};
