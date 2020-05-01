import { all, any } from '@ecs/utils/QueryHelper';
import {
	Shape,
	Body,
	Particle,
	Plane,
	Sphere,
	Heightfield,
	Cylinder,
	ConvexPolyhedron,
	Box,
	Vec3,
	Quaternion as CannonQuaternion
} from 'cannon';
import { System } from '@ecs/ecs/System';
import { useCannonCouple } from './CannonCouple';
import Transform from '@ecs/plugins/Transform';
import MeshShape from '../components/MeshShape';
import { Mesh, Geometry, BufferGeometry, Group, Vector3 as ThreeVector3, Quaternion as ThreeQuaternion, Object3D } from 'three';
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
					const convexShapes: ConvexPolyhedron[] = [];

					let object3d: Object3D;

					if (entity.has(Mesh)) {
						object3d = entity.get(Mesh).clone();
					}

					if (entity.has(Group)) {
						object3d = entity.get(Group).clone();
					}

					if (!object3d) throw new Error('no mesh found :(');

					// Reset position and rotation applied on the entity, it's accounted for later from position applied by meshToConvexPolyhedron
					object3d.position.set(0, 0, 0);
					object3d.rotation.set(0, 0, 0);

					object3d.traverse(child => {
						if (child instanceof Mesh) {
							const { shape, position, quaternion } = meshToConvexPolyhedron(child);

							convexShapes.push(shape);
							body.addShape(shape, position, quaternion);
						}
					});

					entity.add(convexShapes);
					return convexShapes;
				}
			}
		}
	);

export const meshToConvexPolyhedron = (mesh: Mesh) => {
	if (mesh.geometry instanceof BufferGeometry) {
		mesh.geometry = new Geometry().fromBufferGeometry(mesh.geometry);
	}
	console.log(`generating mesh collider for ${mesh.name}`);

	// Get world pos, scale and rotation as the convex geometry does not copy that data
	// Applying the matrix directly to the convex geometry messes it up somehow and causes bad things to happen to collision.
	mesh.updateWorldMatrix(true, false);
	const position = new ThreeVector3();
	const scale = new ThreeVector3();
	const quaternion = new ThreeQuaternion();
	mesh.getWorldPosition(position);
	mesh.getWorldScale(scale);
	mesh.getWorldQuaternion(quaternion);

	// Convert to convex hull (no inside faces)
	const convexGeometry = new ConvexGeometry(mesh.geometry.vertices);
	convexGeometry.scale(scale.x, scale.y, scale.z);

	// convert to Cannon object
	const vertices = convexGeometry.vertices.map(v => new Vec3(v.x, v.y, v.z));
	const faces = convexGeometry.faces.map(f => [f.a, f.b, f.c]);

	return {
		shape: new ConvexPolyhedron(vertices, faces as any),
		position: new Vec3(position.x, position.y, position.z),
		quaternion: new CannonQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
	};
};
