import { all, any } from '@ecs/utils/QueryHelper';
import { Shape, Body, Particle, Plane, Sphere, Heightfield, Cylinder, ConvexPolyhedron, Box, Vec3 } from 'cannon';
import { System } from '@ecs/ecs/System';
import { useCannonCouple } from './CannonCouple';
import Transform from '@ecs/plugins/Transform';
import MeshShape from '../components/MeshShape';
import { Mesh, Geometry, BufferGeometry, Group } from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';

export const useShapeCouple = (system: System) =>
	useCannonCouple<Shape | Shape[]>(
		system,
		[all(Transform, Body), any(Shape, Particle, Plane, Box, Sphere, ConvexPolyhedron, Cylinder, Heightfield, MeshShape)],
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

					// By default cannon points plane in local z dir. Change to y.
					body.quaternion.setFromAxisAngle(new Vec3(-1, 0, 0), Math.PI / 2);

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

				if (entity.has(MeshShape)) {
					const mesh = entity.get(Mesh)?.clone();
					const convexShapes: ConvexPolyhedron[] = [];
					if (!mesh) {
						const group = entity.get(Group)?.clone();
						if (!group) throw new Error('no mesh found :(');

						// Reset world position and rotation
						group.position.set(0, 0, 0);
						group.rotation.set(0, 0, 0);

						group.traverse(child => {
							if (child instanceof Mesh) {
								const convexShape = meshToConvexPolyhedron(child);

								convexShapes.push(convexShape);
								body.addShape(convexShape);
							}
						});

						console.log(convexShapes);
						entity.add(convexShapes);
						return convexShapes;
					}

					// Reset world position and rotation
					mesh.position.set(0, 0, 0);
					mesh.rotation.set(0, 0, 0);

					const convexShape = meshToConvexPolyhedron(mesh);
					entity.add(convexShape);
					body.addShape(convexShape);

					return convexShape;
				}
			}
		}
	);

export const meshToConvexPolyhedron = (mesh: Mesh) => {
	if (mesh.geometry instanceof BufferGeometry) {
		mesh.geometry = new Geometry().fromBufferGeometry(mesh.geometry);
	}
	console.log(`generating mesh collider for ${mesh.name}`);

	// Convert to convex hull (no inside faces)
	const convexGeometry = new ConvexGeometry(mesh.geometry.vertices);
	mesh.updateWorldMatrix(true, false);
	convexGeometry.applyMatrix4(mesh.matrixWorld);

	// convert to Cannon object
	const vertices = convexGeometry.vertices.map(v => new Vec3(v.x, v.y, v.z));
	const faces = convexGeometry.faces.map(f => [f.a, f.b, f.c]);
	return new ConvexPolyhedron(vertices, faces as any);
};
