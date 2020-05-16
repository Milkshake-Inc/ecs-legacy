import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { DirectionalLight, DirectionalLightHelper, Object3D, GridHelper, ArrowHelper } from 'three';
import RenderSystem from '../systems/RenderSystem';
import { useThreeCouple } from './ThreeCouple';

export const useDebugCouple = (system: RenderSystem) =>
	useThreeCouple<Object3D>(system, [all(Transform), any(DirectionalLight, GridHelper, ArrowHelper)], {
		onCreate: entity => {
			if (entity.has(DirectionalLight)) {
				const directionalLight = entity.get(DirectionalLight);
				return new DirectionalLightHelper(directionalLight);
			}

			if(entity.has(GridHelper)) {
				return entity.get(GridHelper);
			}

			if(entity.has(ArrowHelper)) {
				return entity.get(ArrowHelper);
			}


		}
	});
