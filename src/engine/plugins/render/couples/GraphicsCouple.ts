import { System } from '@ecs/ecs/System';
import Position from '@ecs/plugins/Position';
import { all } from '@ecs/utils/QueryHelper';
import { Graphics } from 'pixi.js';
import { usePixiCouple } from './PixiCouple';

export const useGraphicsCouple = (system: System) =>
	usePixiCouple<Graphics>(system, all(Position, Graphics), {
		onCreate: entity => {
			return entity.get(Graphics);
		}
	});
