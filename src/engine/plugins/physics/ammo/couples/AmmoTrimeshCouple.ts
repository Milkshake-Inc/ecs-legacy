import { all, System } from 'tick-knock';
import PhysXTrimesh from '../../physx/component/shapes/TrimeshShape';
import { applyToMeshesIndividually } from '../../3d/couples/ShapeCouple';
import { AmmoInstance } from '../AmmoLoader';
import AmmoBody from '../components/AmmoBody';
import { useAmmoCouple } from './AmmoCouple';
import { getObject3d } from './../../3d/couples/ShapeCouple';

const cachedTrimeshShapes = new Map();

export const useAmmoTrimeshCouple = (system: System) =>
	useAmmoCouple(system, all(PhysXTrimesh), {
		onCreate: entity => {
			const body = entity.get(AmmoBody);
			const mesh = new AmmoInstance.btTriangleMesh();
			const object3d = getObject3d(entity);

			if (cachedTrimeshShapes.has(object3d)) {
				const shape = cachedTrimeshShapes.get(object3d);
				body.shape = shape;
				return shape;
			}

			applyToMeshesIndividually(entity, ({ geometry, position, rotation }) => {
				const vec3A = new AmmoInstance.btVector3(0, 0, 0);
				const vec3B = new AmmoInstance.btVector3(0, 0, 0);
				const vec3C = new AmmoInstance.btVector3(0, 0, 0);

				for (let index = 0; index < geometry.faces.length; index++) {
					const face = geometry.faces[index];

					const a = geometry.vertices[face.a];
					const b = geometry.vertices[face.b];
					const c = geometry.vertices[face.c];

					vec3A.setValue(a.x, a.y, a.z);
					vec3B.setValue(b.x, b.y, b.z);
					vec3C.setValue(c.x, c.y, c.z);

					mesh.addTriangle(vec3A, vec3B, vec3C);
				}
			});

			const shape = new AmmoInstance.btBvhTriangleMeshShape(mesh, true, true);

			const triangleInfoMap = new (AmmoInstance as any).btTriangleInfoMap();

			// Higher detail edges
			triangleInfoMap.m_edgeDistanceThreshold = 0.01;

			triangleInfoMap.generateInternalEdgeInfo(shape);

			body.shape = shape;

			cachedTrimeshShapes.set(object3d, shape);

			return shape;
		}
	});
