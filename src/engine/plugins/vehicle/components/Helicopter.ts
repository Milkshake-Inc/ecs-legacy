import { Object3D } from 'three';

export default class Helicopter {
	constructor(public enginePower: number = 0, public rotors: Object3D[] = []) {}
}
