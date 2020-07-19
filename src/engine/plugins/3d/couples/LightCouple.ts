import Transform from '@ecs/plugins/Transform';
import { all, any } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { AmbientLight, Light, PointLight, DirectionalLight, Group } from 'three';
import RenderSystem from '../systems/RenderSystem';
import { ToThreeVector3 } from '@ecs/plugins/physics/utils/Conversions';
import { useSingletonQuery } from '@ecs/ecs/helpers';
import RenderState from '../components/RenderState';

export const useLightCouple = (system: RenderSystem) => {

	const getRenderState = useSingletonQuery(system, RenderState);

	return useThreeCouple<Group>(system, [all(Transform), any(Light, AmbientLight, PointLight, DirectionalLight)], {
		onCreate: entity => {
			const group = new Group();

			if (entity.has(AmbientLight)) {
				group.add(entity.get(AmbientLight));
			}

			if (entity.has(DirectionalLight)) {
				group.add(entity.get(DirectionalLight));

				getRenderState().scene.add(entity.get(DirectionalLight).target);
			}

			if (entity.has(PointLight)) {
				group.add(entity.get(PointLight));
			}

			return group;
		}
	});
};
