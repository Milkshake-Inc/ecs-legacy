import { all, any } from '@ecs/ecs/Query';
import {
	Transform,
	Constraint,
	DistanceConstraint,
	ConeTwistConstraint,
	HingeConstraint,
	LockConstraint,
	PointToPointConstraint
} from 'cannon-es';
import { System } from '@ecs/ecs/System';
import { useCannonCouple } from './CannonCouple';

export const useConstraintCouple = (system: System) =>
	useCannonCouple<Constraint>(
		system,
		[all(Transform), any(Constraint, DistanceConstraint, ConeTwistConstraint, HingeConstraint, LockConstraint, PointToPointConstraint)],
		{
			onCreate: entity => {
				if (entity.has(Constraint)) {
					return entity.get(Constraint);
				}

				if (entity.has(DistanceConstraint)) {
					return entity.get(DistanceConstraint);
				}

				if (entity.has(ConeTwistConstraint)) {
					return entity.get(ConeTwistConstraint);
				}

				if (entity.has(HingeConstraint)) {
					return entity.get(HingeConstraint);
				}

				if (entity.has(LockConstraint)) {
					return entity.get(LockConstraint);
				}

				if (entity.has(PointToPointConstraint)) {
					return entity.get(PointToPointConstraint);
				}
			}
		}
	);
