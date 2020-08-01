import { all } from '@ecs/ecs/Query';
import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/math/Transform';
import Ammo from 'ammojs-typed';
import TrimeshShape from '../../3d/components/TrimeshShape';
import { applyToMeshesIndividually } from '../../3d/couples/ShapeCouple';
import { AmmoInstance } from '../AmmoPhysicsSystem';
import { useAmmoCouple } from './AmmoCouple';

export const useAmmoTrimeshCouple = (system: System) =>
	useAmmoCouple(system, all(TrimeshShape), {
		onCreate: entity => {
			const { position, quaternion } = entity.get(Transform);

			const mesh = new Ammo.btTriangleMesh();

			applyToMeshesIndividually(entity, ({ geometry, position, rotation }) => {
				const vec3A = new Ammo.btVector3(0, 0, 0);
				const vec3B = new Ammo.btVector3(0, 0, 0);
				const vec3C = new Ammo.btVector3(0, 0, 0);

				for (let index = 0; index < geometry.faces.length; index++) {
					const face = geometry.faces[index];

					const a = geometry.vertices[face.a];
					const b = geometry.vertices[face.b];
					const c = geometry.vertices[face.c];

					vec3A.setValue(a.x, a.y, a.z);
					vec3B.setValue(b.x, b.y, b.z);
					vec3C.setValue(c.x, c.y, c.z);

					mesh.addTriangle(vec3A, vec3B, vec3C, true);
				}
			});

			const shape = new Ammo.btBvhTriangleMeshShape(mesh, true, true);

			const transform = new AmmoInstance.btTransform();
			transform.setIdentity();
			transform.setOrigin(new AmmoInstance.btVector3(position.x, position.y, position.z));
			transform.setRotation(new AmmoInstance.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));

			const localInertia = new AmmoInstance.btVector3(0, 0, 0);
			// shapes.calculateLocalInertia(1, localInertia);

			const motionState = new AmmoInstance.btDefaultMotionState(transform);
			const rbInfo = new AmmoInstance.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);

			return new AmmoInstance.btRigidBody(rbInfo);
		},
		onUpdate: (entity, couple: Ammo.btRigidBody) => {
			const ammoTransform = couple.getWorldTransform();
			const ammoPosition = ammoTransform.getOrigin();
			const ammoRotation = ammoTransform.getRotation();

			const transform = entity.get(Transform);

			transform.position.set(ammoPosition.x(), ammoPosition.y(), ammoPosition.z());

			transform.quaternion.set(ammoRotation.x(), ammoRotation.y(), ammoRotation.z(), ammoRotation.w());
		}
	});
