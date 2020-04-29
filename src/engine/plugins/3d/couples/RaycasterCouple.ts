import { useCouple, useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import { all } from '@ecs/utils/QueryHelper';
import { Object3D, Line, Geometry, Vector3, LineBasicMaterial, Raycaster } from 'three';
import Raycast, { RaycastDebug } from '../components/Raycaster';
import RenderState from '../components/RenderState';
import RenderSystem from '../systems/RenderSystem';
import { useThreeCouple } from './ThreeCouple';
import Transform from '@ecs/plugins/Transform';

export const useRaycastCouple = <T extends Object3D>(
	system: System,
) => {
	const query = useQueries(system, {
		renderState: all(RenderState),
		raycast: all(Transform, Raycast)
	});

	const getRenderState = () => {
		return query.renderState.first.get(RenderState);
	};

	return useCouple<Raycaster>(query.raycast, {
		onCreate: entity => {
			return new Raycaster();
		},
		onUpdate: (entity, raycaster, dt) => {
            const { position, rotation: direction } = entity.get(Transform);

            raycaster.ray.origin.set(position.x, position.y, position.z);
            raycaster.ray.direction.set(direction.x, direction.y, direction.z);

            const raycast = entity.get(Raycast);
            raycast.intersects = raycaster.intersectObjects(getRenderState().scene.children, true);

		},
		onDestroy: (entity, object3D) => {
		}
	});
};

export const useRaycastDebugCouple = (system: RenderSystem) =>
    useThreeCouple<Line>(system, all(Raycast, RaycastDebug), {
    onCreate: entity => {
        const geom = new Geometry();
        geom.vertices.push(new Vector3());
        geom.vertices.push(new Vector3());

        const material = new LineBasicMaterial( { color : 0xff0000 } );

        return new Line(
            geom,
            material
        );
    },
    onUpdate(entity, line) {
        const { position, rotation: direction } = entity.get(Transform);
        // const raycast = entity.get(Raycast);

        if(line.geometry instanceof Geometry) {
            line.geometry.vertices[0].set(position.x, position.y, position.z);
            line.geometry.vertices[1].set(direction.x, direction.y, direction.z).multiplyScalar(100)

            console.log(line.geometry.vertices[1]);
        }


    }
});
