import { all, any } from '@ecs/utils/QueryHelper';
import { Shape, Body, Particle, Plane, Sphere, Heightfield, Cylinder, ConvexPolyhedron, Box } from 'cannon';
import { System } from '@ecs/ecs/System';
import { useCannonCouple } from './CannonCouple';
import Transform from '@ecs/plugins/Transform';

export const useShapeCouple = (system: System) =>
	useCannonCouple<Shape>(
		system,
		[all(Transform, Body), any(Shape, Particle, Plane, Box, Sphere, ConvexPolyhedron, Cylinder, Heightfield)],
		{
			onCreate: entity => {
				const body = entity.get(Body);

				if (entity.has(Shape)) {
					body.addShape(entity.get(Shape));
					return entity.get(Shape);
				}

				if (entity.has(Particle)) {
					body.addShape(entity.get(Particle));
					return entity.get(Particle);
				}

				if (entity.has(Plane)) {
					body.addShape(entity.get(Plane));
					return entity.get(Plane);
				}

				if (entity.has(Box)) {
					body.addShape(entity.get(Box));
					return entity.get(Box);
				}

				if (entity.has(Sphere)) {
					body.addShape(entity.get(Sphere));
					return entity.get(Sphere);
				}

				if (entity.has(ConvexPolyhedron)) {
					body.addShape(entity.get(ConvexPolyhedron));
					return entity.get(ConvexPolyhedron);
				}

				if (entity.has(Cylinder)) {
					body.addShape(entity.get(Cylinder));
					return entity.get(Cylinder);
				}

				if (entity.has(Heightfield)) {
					body.addShape(entity.get(Heightfield));
					return entity.get(Heightfield);
				}
			}
		}
	);
