import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Position from '@ecs/plugins/Position';
import { all } from '@ecs/utils/QueryHelper';
import { PerspectiveCamera } from 'three';
import ThirdPersonTarget from '../components/ThirdPersonTarget';

export default class ThirdPersonCameraSystem extends System {
	private queries = useQueries(this, {
		camera: all(Position, PerspectiveCamera),
		target: all(Position, ThirdPersonTarget)
	});

	update(dt: number) {
		const camera = {
			position: this.queries.camera.first.get(Position),
			cam: this.queries.camera.first.get(PerspectiveCamera)
		};

		const target = {
			position: this.queries.target.first.get(Position),
			target: this.queries.target.first.get(ThirdPersonTarget)
		};

		const angleX = Math.cos(target.position.rotation.y);
		const angleY = Math.sin(target.position.rotation.y);

		camera.position.x = target.position.x + angleY * target.target.angle;
		camera.position.y = target.position.y + target.target.distance;
		camera.position.z = target.position.z + angleX * target.target.angle;

		camera.cam.lookAt(target.position.x, target.position.y, target.position.z);
		camera.position.rotation.x = camera.cam.rotation.x;
		camera.position.rotation.y = camera.cam.rotation.y;
		camera.position.rotation.z = camera.cam.rotation.z;
	}
}
