import Position from '@ecs/plugins/Position';
import { all, any } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { AmbientLight, Light, PointLight } from 'three';
import RenderSystem from '../systems/RenderSystem';

export const useLightCouple = (system: RenderSystem) =>
	useThreeCouple<Light>(system, [all(Position), any(Light, AmbientLight, PointLight)], {
		onCreate: entity => {
			if (entity.has(AmbientLight)) {
				return entity.get(AmbientLight);
			}

			if (entity.has(PointLight)) {
				return entity.get(PointLight);
			}

			return entity.get(Light);
		}
	});
