export type Class<T> = {
	new (...args: any[]): T;
};

export const isClass = <T>(value: T | Class<T>): value is Class<T> => {
	return (value as any).prototype !== undefined;
};

export const isFunction = (func: any): func is Function => {
	return func instanceof Function;
};
