import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { PerspectiveCamera } from 'three';
import ThirdPersonTarget from '../components/ThirdPersonTarget';

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

		const angleX = Math.cos(target.transform.rotation.y);
		const angleY = Math.sin(target.transform.rotation.y);

		camera.transform.position.x = target.transform.position.x + angleY * target.target.angle;
		camera.transform.position.y = target.transform.position.y + target.target.distance;
		camera.transform.position.z = target.transform.position.z + angleX * target.target.angle;

		camera.cam.lookAt(target.transform.position.x, target.transform.position.y, target.transform.position.z);
		camera.transform.rotation.x = camera.cam.rotation.x;
		camera.transform.rotation.y = camera.cam.rotation.y;
		camera.transform.rotation.z = camera.cam.rotation.z;
	}
}
