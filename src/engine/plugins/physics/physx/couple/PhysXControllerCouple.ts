import { useEvents, useQueries } from '@ecs/core/helpers';
import { all } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { PhysXController } from '../component/PhysXController';
import { PhysXEvents, PhysXState } from '../PhysXPhysicsSystem';
import { usePhysXCouple } from './PhysXCouple';

export const useControllerCouple = (system: System) => {
	const query = useQueries(system, {
		physxState: all(PhysXState)
	});

	const getPhysXState = () => {
		return query.physxState.first?.get(PhysXState);
	};

	const events = useEvents();

	return usePhysXCouple(system, all(PhysXController), {
		onCreate: entity => {
			const manager = PhysX.PxCreateControllerManager(getPhysXState().scene, false);

			const controller = entity.get(PhysXController);

			const controllerDesc = new PhysX.PxCapsuleControllerDesc();
			controllerDesc.height = 0.0001;
			controllerDesc.radius = 0.029;
			controllerDesc.stepOffset = 0;
			controllerDesc.contactOffset = 0.001;
			controllerDesc.slopeLimit = 0;

			controllerDesc.setReportCallback(
				PhysX.PxUserControllerHitReport.implement({
					onShapeHit: (event) => {
						events.emit(PhysXEvents.CONTROLLER_SHAPE_HIT, entity, event);
					},
					onControllerHit: (event) => {
						events.emit(PhysXEvents.CONTROLLER_CONTROLLER_HIT, entity, event);
					},
					onObstacleHit: (event) => {
						events.emit(PhysXEvents.CONTROLLER_OBSTACLE_HIT, entity, event);
					}
				})
			);

			controllerDesc.setMaterial(getPhysXState().physics.createMaterial(0, 0, 0));

			if (!controllerDesc.isValid()) {
				console.warn("[WARN] Controller Description invalid!");
			}

			controller.controller = manager.createController(controllerDesc);

			const position = entity.get(Transform);

			controller.controller.setPosition({
				x: position.x,
				y: position.y,
				z: position.z
			});

			return controller.controller;
		},
		onUpdate: (entity, body: PhysX.PxController) => {
			const transform = entity.get(Transform);
			const position = body.getPosition();

			transform.position.set(position.x, position.y, position.z);
		}
	});
};
