import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { DirectionalLight, DirectionalLightHelper, Object3D } from 'three';
import RenderSystem from '../systems/RenderSystem';
import { useThreeCouple } from './ThreeCouple';

export const useDebugCouple = (system: RenderSystem) =>
	useThreeCouple<Object3D>(system, [all(Transform), any(DirectionalLight)], {
		onCreate: entity => {
			if (entity.has(DirectionalLight)) {
				const directionalLight = entity.get(DirectionalLight);
				return new DirectionalLightHelper(directionalLight)
			}
		}
	});
