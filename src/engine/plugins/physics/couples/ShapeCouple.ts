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
import { Mesh, Geometry, BufferGeometry, Group, Vector3 as ThreeVector3, Quaternion as ThreeQuaternion, Euler } from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import CannonBody from '../components/CannonBody';
import { Entity } from '@ecs/ecs/Entity';
import BoundingSphereShape from '../components/BoundingSphereShape';
import BoundingCylinderShape from '../components/BoundingCylinderShape';
import BoundingBoxShape from '../components/BoundingBoxShape';
import BoundingCapsuleShape from '../components/BoundingCapsuleShape';

export const NoMeshError = new Error('no mesh found :(');

export const useShapeCouple = (system: System) =>
	useCannonCouple<Shape | Shape[]>(
		system,
		[
			all(Transform),
			any(Body, CannonBody),
			any(
				Shape,
				Particle,
				Plane,
				Box,
				Sphere,
				ConvexPolyhedron,
				Cylinder,
				Heightfield,
				MeshShape,
				BoundingSphereShape,
				BoundingBoxShape,
				BoundingCylinderShape,
				BoundingCapsuleShape
			)
		],
		{
			onCreate: entity => {
				const body = entity.get(CannonBody) || entity.get(Body);

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

				if (entity.has(BoundingBoxShape)) {
					const shapes: Box[] = [];

					applyToMeshesIndividually(entity, ({ mesh, geometry, position, scale, rotation }) => {
						console.log(`generating BoundingBox for ${mesh.name}`);

						// Scale geometry to correct world size
						geometry.scale(scale.x, scale.y, scale.z);

						// Calculate bounding box and offset world position
						geometry.computeBoundingBox();
						const center = geometry.boundingBox.getCenter(new ThreeVector3());
						const size = geometry.boundingBox.getSize(new ThreeVector3()).divideScalar(2);
						position.add(center.applyQuaternion(rotation));

						const shape = new Box(new Vec3(size.x, size.y, size.z));

						body.addShape(
							shape,
							new Vec3(position.x, position.y, position.z),
							new CannonQuaternion(rotation.x, rotation.y, rotation.z, rotation.w)
						);
						shapes.push(shape);
					});

					entity.add(shapes);
					return shapes;
				}

				if (entity.has(BoundingSphereShape)) {
					const shapes: Sphere[] = [];

					applyToMeshesIndividually(entity, ({ mesh, geometry, position, scale, rotation }) => {
						console.log(`generating BoundingSphere for ${mesh.name}`);
						// Scale geometry to correct world size
						geometry.scale(scale.x, scale.y, scale.z);

						// Calculate bounding sphere and offset world position
						geometry.computeBoundingSphere();
						const center = geometry.boundingSphere.center;
						const size = geometry.boundingSphere.radius;
						position.add(center.applyQuaternion(rotation));

						const shape = new Sphere(size);

						body.addShape(
							shape,
							new Vec3(position.x, position.y, position.z),
							new CannonQuaternion(rotation.x, rotation.y, rotation.z, rotation.w)
						);
						shapes.push(shape);
					});

					entity.add(shapes);
					return shapes;
				}

				if (entity.has(BoundingCylinderShape)) {
					const shapes: Cylinder[] = [];

					applyToMeshesIndividually(entity, ({ mesh, geometry, position, scale, rotation }) => {
						console.log(`generating BoundingCylinder for ${mesh.name}`);

						// Scale geometry to correct world size
						geometry.scale(scale.x, scale.y, scale.z);

						// Calculate bounding box and offset world position
						geometry.computeBoundingBox();
						const box = geometry.boundingBox;
						const center = box.getCenter(new ThreeVector3());
						position.add(center.applyQuaternion(rotation));

						const axes = ['x', 'y', 'z'];
						const major = entity.get(BoundingCylinderShape).axis;
						const minor = axes.splice(axes.indexOf(major), 1) && axes;

						const height = box.max[major] - box.min[major];
						const radius = 0.5 * Math.max(box.max[minor[0]] - box.min[minor[0]], box.max[minor[1]] - box.min[minor[1]]);

						rotation = rotation.multiplyQuaternions(
							rotation,
							new ThreeQuaternion().setFromEuler(
								new Euler(major == 'y' ? Math.PI / 2 : 0, major == 'x' ? Math.PI / 2 : 0, major == 'z' ? Math.PI / 2 : 0)
							)
						);

						const shape = new Cylinder(radius, radius, height, 12);

						body.addShape(
							shape,
							new Vec3(position.x, position.y, position.z),
							new CannonQuaternion(rotation.x, rotation.y, rotation.z, rotation.w)
						);
						shapes.push(shape);
					});

					entity.add(shapes);
					return shapes;
				}

				if (entity.has(BoundingCapsuleShape)) {
					const shapes: Cylinder[] = [];

					applyToMeshesIndividually(entity, ({ mesh, geometry, position, scale, rotation }) => {
						console.log(`generating BoundingCylinder for ${mesh.name}`);

						// Scale geometry to correct world size
						geometry.scale(scale.x, scale.y, scale.z);

						// Calculate bounding box and offset world position
						geometry.computeBoundingBox();
						const box = geometry.boundingBox;
						const center = box.getCenter(new ThreeVector3());

						const axes = ['x', 'y', 'z'];
						const major = entity.get(BoundingCapsuleShape).axis;
						const minor = axes.splice(axes.indexOf(major), 1) && axes;

						const height = box.max[major] - box.min[major];
						const radius = 0.5 * Math.max(box.max[minor[0]] - box.min[minor[0]], box.max[minor[1]] - box.min[minor[1]]);

						position.add(center.applyQuaternion(rotation));
						rotation = rotation.multiplyQuaternions(
							rotation,
							new ThreeQuaternion().setFromEuler(
								new Euler(major == 'y' ? Math.PI / 2 : 0, major == 'x' ? Math.PI / 2 : 0, major == 'z' ? Math.PI / 2 : 0)
							)
						);

						const shape = new Cylinder(radius, radius, height, 12);

						body.addShape(
							shape,
							new Vec3(position.x, position.y, position.z),
							new CannonQuaternion(rotation.x, rotation.y, rotation.z, rotation.w)
						);
						shapes.push(shape);
					});

					entity.add(shapes);
					return shapes;
				}

				if (entity.has(MeshShape)) {
					const shapes: ConvexPolyhedron[] = [];

					applyToMeshesIndividually(entity, ({ mesh, geometry, position, scale, rotation }) => {
						console.log(`generating MeshShape for ${mesh.name}`);

						const convexGeometry = new ConvexGeometry(geometry.vertices);
						convexGeometry.scale(scale.x, scale.y, scale.z);

						const vertices = convexGeometry.vertices.map(v => new Vec3(v.x, v.y, v.z));
						const faces = convexGeometry.faces.map(f => [f.a, f.b, f.c]);

						const shape = new ConvexPolyhedron(vertices, faces as any);
						body.addShape(
							shape,
							new Vec3(position.x, position.y, position.z),
							new CannonQuaternion(rotation.x, rotation.y, rotation.z, rotation.w)
						);
						shapes.push(shape);
					});

					entity.add(shapes);
					return shapes;
				}
			}
		}
	);

export const applyToMeshesIndividually = (
	entity: Entity,
	callback: (data: { mesh: Mesh; geometry: Geometry; position: ThreeVector3; scale: ThreeVector3; rotation: ThreeQuaternion }) => void
) => {
	let object3d = entity.get(Mesh) || entity.get(Group);
	if (!object3d) throw NoMeshError;

	// Reset position and rotation applied on the entity, it's accounted for later from position applied later
	object3d = object3d.clone();
	object3d.position.set(0, 0, 0);
	object3d.rotation.set(0, 0, 0);

	object3d.traverse(mesh => {
		mesh.updateWorldMatrix(true, false);
		if (mesh instanceof Mesh) {
			if (mesh.geometry instanceof BufferGeometry) {
				mesh.geometry = new Geometry().fromBufferGeometry(mesh.geometry);
			}

			// Get world pos, scale and rotation as the convex geometry does not copy that data
			// Applying the matrix directly to the convex geometry messes it up somehow and causes bad things to happen to collision.
			mesh.updateWorldMatrix(true, false);
			const position = new ThreeVector3();
			const scale = new ThreeVector3();
			const rotation = new ThreeQuaternion();

			mesh.matrixWorld.decompose(position, rotation, scale);
			callback({ mesh, geometry: mesh.geometry, position, scale, rotation });
		}
	});
};
