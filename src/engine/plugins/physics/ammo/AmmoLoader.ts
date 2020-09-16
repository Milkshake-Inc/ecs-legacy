import Ammo from 'ammojs-typed';

type Unpacked<T> = T extends (infer U)[] ? U : T extends (...args: any[]) => infer U ? U : T extends Promise<infer U> ? U : T;

export type AmmoType = Unpacked<ReturnType<typeof Ammo>>;
export let AmmoInstance: AmmoType = null;

export const setAmmo = (ammo: any) => {
	AmmoInstance = ammo;
};
