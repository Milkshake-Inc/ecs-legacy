import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { AmbientLight, Light, PointLight, DirectionalLight } from 'three';
import RenderSystem from '../systems/RenderSystem';

export const useLightCouple = (system: RenderSystem) =>
	useThreeCouple<Light>(system, [all(Transform), any(Light, AmbientLight, PointLight, DirectionalLight)], {
		onCreate: entity => {
			if (entity.has(DirectionalLight)) {
				return entity.get(DirectionalLight);
			}

			if (entity.has(AmbientLight)) {
				return entity.get(AmbientLight);
			}

			if (entity.has(PointLight)) {
				return entity.get(PointLight);
			}

			return entity.get(Light);
		}
	});
