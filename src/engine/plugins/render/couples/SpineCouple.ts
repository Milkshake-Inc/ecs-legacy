import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { usePixiCouple } from './PixiCouple';
import * as PIXI from 'pixi.js';
window.PIXI = PIXI;
import 'pixi-spine';

export const useSpineCouple = (system: System) =>
	usePixiCouple<PIXI.spine.Spine>(system, all(Transform, PIXI.spine.Spine), {
		onCreate: entity => {
			return entity.get(PIXI.spine.Spine);
		}
	});
