import { all } from '@ecs/ecs/Query';
import { System } from '@ecs/ecs/System';
import Ammo from 'ammojs-typed';
import TrimeshShape from '../../3d/components/TrimeshShape';
import { applyToMeshesIndividually } from '../../3d/couples/ShapeCouple';
import { useAmmoCouple } from './AmmoCouple';
import AmmoBody from '../components/AmmoBody';

export const useAmmoTrimeshCouple = (system: System) =>
	useAmmoCouple(system, all(TrimeshShape), {
		onCreate: entity => {
			const body = entity.get(AmmoBody);
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
			body.shape = shape;

			return shape;
		}
	});
