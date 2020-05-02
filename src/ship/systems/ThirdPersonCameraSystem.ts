import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { PerspectiveCamera } from 'three';
import ThirdPersonTarget from '../components/ThirdPersonTarget';
import MathHelper from '@ecs/math/MathHelper';

export default class ThirdPersonCameraSystem extends System {
	private queries = useQueries(this, {
		camera: all(Transform, PerspectiveCamera),
		target: all(Transform, ThirdPersonTarget)
	});

	update(dt: number) {
		const camera = {
			transform: this.queries.camera.first.get(Transform),
			cam: this.queries.camera.first.get(PerspectiveCamera)
		};

		const target = {
			transform: this.queries.target.first.get(Transform),
			target: this.queries.target.first.get(ThirdPersonTarget)
		};

		const rotation = target.transform.quaternion.toEuler();
		const angleX = Math.cos(-rotation.y);
		const angleY = Math.sin(-rotation.y);

		const a = 1;

		camera.transform.position.x = MathHelper.lerp(
			camera.transform.position.x,
			target.transform.position.x - angleY * target.target.angle,
			a
		);

		camera.transform.position.y = MathHelper.lerp(camera.transform.position.y, target.transform.position.y + target.target.distance, a);

		camera.transform.position.z = MathHelper.lerp(
			camera.transform.position.z,
			target.transform.position.z + angleX * target.target.angle,
			a
		);

		camera.cam.lookAt(target.transform.position.x, target.transform.position.y, target.transform.position.z);
		camera.transform.quaternion.set(camera.cam.quaternion.x, camera.cam.quaternion.y, camera.cam.quaternion.z, camera.cam.quaternion.w);
	}
}
