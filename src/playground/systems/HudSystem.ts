import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { makeQuery, any } from '@ecs/utils/QueryHelper';
import Score from '../components/Score';
import { Entity } from '@ecs/ecs/Entity';
import BitmapText from '@ecs/plugins/render/components/BitmapText';

export type Hud = {
	redScore: Entity;
	blueScore: Entity;
};

export default class HudSystem extends IterativeSystem {
	private hud: Hud;

	constructor(hud: Hud) {
		super(makeQuery(any(Score)));
		this.hud = hud;
	}

	protected updateEntity(entity: Entity): void {
		if (entity.has(Score)) {
			const score = entity.get(Score);
			this.hud.blueScore.get(BitmapText).text = score.blue.toString();
			this.hud.redScore.get(BitmapText).text = score.red.toString();
		}
	}
}
