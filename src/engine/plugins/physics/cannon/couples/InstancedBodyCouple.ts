import { System, all } from 'tick-knock';
import Transform from '@ecs/plugins/math/Transform';
import { useCannonCouple } from './CannonCouple';
import CannonBody, { CannonBodyOptions } from '../components/CannonBody';
import CannonInstancedBody from '../components/CannonInstancedBody';
import { InstancedMesh } from 'three';
import Vector3 from '@ecs/plugins/math/Vector';
import { ToCannonVector3 } from '../utils/Conversions';

export const useInstancedBodyCouple = (system: System) =>
	useCannonCouple<CannonInstancedBody>(system, [all(Transform, InstancedMesh, CannonInstancedBody)], {
		onCreate: entity => {
			const transform = entity.get(Transform);
			const instancedBody = entity.get(CannonInstancedBody);
			const mesh = entity.get(InstancedMesh);
			const meshArray = mesh.instanceMatrix.array;

			for (let i = 0; i < mesh.count; i++) {
				const index = i * 16;

				let position = new Vector3(meshArray[index + 12], meshArray[index + 13], meshArray[index + 14]);
				position = position.applyQuaternion(transform.quaternion).add(transform.position);

				delete instancedBody.options.position;

				const body = new CannonBody({
					position: ToCannonVector3(position),
					...(instancedBody.options as CannonBodyOptions)
				});

				instancedBody.bodies.push(body);
			}

			return instancedBody;
		},
		onUpdate: (entity, body, dt) => { }
	});
