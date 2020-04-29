import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { PerspectiveCamera } from 'three';
import RenderSystem from '../systems/RenderSystem';

export const usePerspectiveCameraCouple = (system: RenderSystem) =>
	useThreeCouple<PerspectiveCamera>(system, all(Transform, PerspectiveCamera), {
		onCreate: entity => {
			return entity.get(PerspectiveCamera);
		}
	});
