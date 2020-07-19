import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { ArrowHelper, CameraHelper, DirectionalLight, GridHelper, Group, Object3D } from 'three';
import RenderSystem from '../systems/RenderSystem';
import { useThreeCouple } from './ThreeCouple';

export const useDebugCouple = (system: RenderSystem) =>
	useThreeCouple<Object3D>(system, [all(Transform), any(DirectionalLight, GridHelper, ArrowHelper, CameraHelper)], {
		onCreate: entity => {
			const group = new Group();
			// if (entity.has(DirectionalLight)) {
			// 	const directionalLight = entity.get(DirectionalLight);
			// 	group.add(new DirectionalLightHelper(directionalLight));
			// }

			if (entity.has(GridHelper)) {
				group.add(entity.get(GridHelper));
			}

			if (entity.has(ArrowHelper)) {
				group.add(entity.get(ArrowHelper));
			}
			if (entity.has(CameraHelper)) {
				console.log("Added")
				group.add(entity.get(CameraHelper));
			}
			return group;
		}
	});
