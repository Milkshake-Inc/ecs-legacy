import { useCouple, useQueries } from "@ecs/core/helpers";
import { Fog, FogExp2 } from "three";
import { all, any, Entity, System } from "tick-knock";
import RenderState from "../components/RenderState";

export const useFogCouple = (system: System) => {
    const query = useQueries(system, {
        renderState: all(RenderState),
        fog: any(Fog, FogExp2),
    });

    const getFog = (entity: Entity) => {
        return entity.get(Fog) ?? entity.get(FogExp2)
    };

    const getRenderState = () => query.renderState.first.get(RenderState);

    return useCouple(query.fog, {
        onCreate: (entity) => {
            const fog = getFog(entity);
            const { scene } = getRenderState();

            scene.fog = fog;

            return fog;
        },
        onUpdate: () => { },
        onDestroy: (entity) => {
            const { scene } = getRenderState();

            scene.fog = null;
        }
    })
};