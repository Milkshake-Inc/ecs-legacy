import { allRandom } from 'dog-names';
import Random from '@ecs/plugins/math/Random';

const COLORS = [0x7e32ec, 0xec324c, 0xff2656, 0x32ec9f, 0xecc732];

export default class GolfPlayer {
	public id: string;
	public name: string;
	public color: number;

	constructor(id: string, name: string = allRandom(), color: number = Random.fromArray(COLORS)) {
		this.id = id;
		this.name = name;
		this.color = color;
	}
}
