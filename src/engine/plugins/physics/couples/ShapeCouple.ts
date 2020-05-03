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
import { Mesh, Geometry, BufferGeometry, Group, Vector3 as ThreeVector3, Quaternion as ThreeQuaternion } from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import CannonBody from '../components/CannonBody';
import { Entity } from '@ecs/ecs/Entity';
import BoundingSphereShape from '../components/BoundingSphereShape';
import BoundingCylinderShape from '../components/BoundingCylinderShape';
import BoundingBoxShape from '../components/BoundingBoxShape';

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
				BoundingCylinderShape
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
					applyToMeshesIndividually(entity, ({ mesh, geometry, position, scale, rotation }) => {
						console.log(`generating BoundingBox for ${mesh.name}`);

						// Scale geometry to correct world size
						geometry.scale(scale.x, scale.y, scale.z);

						// Calculate bounding box and offset world position
						geometry.computeBoundingBox();
						const center = geometry.boundingBox.getCenter(new ThreeVector3());
						const size = geometry.boundingBox.getSize(new ThreeVector3()).divideScalar(2);
						position.add(center.applyQuaternion(rotation));

						body.addShape(
							new Box(new Vec3(size.x, size.y, size.z)),
							new Vec3(position.x, position.y, position.z),
							new CannonQuaternion(rotation.x, rotation.y, rotation.z, rotation.w)
						);
					});
				}

				if (entity.has(BoundingSphereShape)) {
					applyToMeshesIndividually(entity, ({ mesh, geometry, position, scale, rotation }) => {
						console.log(`generating BoundingSphere for ${mesh.name}`);
						// Scale geometry to correct world size
						geometry.scale(scale.x, scale.y, scale.z);

						// Calculate bounding sphere and offset world position
						geometry.computeBoundingSphere();
						const center = geometry.boundingSphere.center;
						const size = geometry.boundingSphere.radius;
						position.add(center.applyQuaternion(rotation));

						body.addShape(
							new Sphere(size),
							new Vec3(position.x, position.y, position.z),
							new CannonQuaternion(rotation.x, rotation.y, rotation.z, rotation.w)
						);
					});
				}

				if (entity.has(BoundingCylinderShape)) {
					applyToMeshesIndividually(entity, ({ mesh, geometry, position, scale, rotation }) => {
						console.log(`generating BoundingCylinder for ${mesh.name}`);

						throw new Error('not implemented');

						// // Scale geometry to correct world size
						// geometry.scale(scale.x, scale.y, scale.z);

						// // Calculate bounding box and offset world position
						// geometry.computeBoundingBox();
						// const center = geometry.boundingBox.getCenter(new ThreeVector3());
						// const size = geometry.boundingBox.getSize(new ThreeVector3()).divideScalar(2);
						// position.add(center.applyQuaternion(rotation));

						// const radius = Math.max(size.x, size.y);

						// body.addShape(
						// 	new Cylinder(radius, radius, size.y, 12),
						// 	new Vec3(position.x, position.y, position.z),
						// 	new CannonQuaternion(rotation.x, rotation.y, rotation.z, rotation.w)
						// );
					});
				}

				if (entity.has(MeshShape)) {
					const convexShapes: ConvexPolyhedron[] = [];

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
						convexShapes.push(shape);
					});

					entity.add(convexShapes);
					return convexShapes;
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
