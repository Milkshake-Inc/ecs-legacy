import { Sound } from '@ecs/plugins/sound/components/Sound';

export function getSound(sprite: string, rate = 1) {
	return Object.assign(new Sound('assets/hockey/sprite.ogg'), {
		sprite: {
			silence: [0, 100, true],
			firework: [200, 504.1723356009071],
			goal: [1300, 392.69841269841277],
			goal2: [105500, 555.7823129251744],
			hit: [2400, 259.4557823129251],
			hit2: [3500, 371.7913832199544],
			levelChange: [4600, 1504.5351473922901],
			throw: [6699.999999999999, 219.36507936507965],
			wallHit1: [7800, 722.7664399092974],
			wallHit2: [8900, 320.0907029478461],
			wallHit3: [10000, 349.4331065759635],
			win: [11100, 1727.9138321995458],
			click1: [13200, 400.00000000000034],
			click2: [14299.999999999998, 45.306122448979025],
			music: [15399.999999999998, 89684.58049886621]
		},
		playSprite: sprite,
		rate
	});
}
