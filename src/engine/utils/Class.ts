export type Class<T> = {
	new (...args: any[]): T;
};

export const isClass = <T>(value: T | Class<T>): value is Class<T> => {
	return typeof value === 'function' && /^class\s/.test(Function.prototype.toString.call(value));
};
