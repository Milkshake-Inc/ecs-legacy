/* eslint-disable no-mixed-spaces-and-tabs */
import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Vector3 from '@ecs/math/Vector';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { PerspectiveCamera } from 'three';
import ThirdPersonTarget from './ThirdPersonTarget';

export default class ThirdPersonCameraSystem extends System {
	private lastPosition = { x: 0, y: 0 };
	private cameraAngle: Vector3 = new Vector3(0.76, 0.3);

	private zoom = 4;
	private locked = false;
	private queries = useQueries(this, {
		camera: all(Transform, PerspectiveCamera),
		target: all(Transform, ThirdPersonTarget)
	});

	constructor() {
		super();

		const requestedElement = document.body;

		requestedElement.addEventListener('click', () => {
			document.body.requestPointerLock();
		});

		document.body.addEventListener('mousemove', this.handleMouseMove.bind(this));
		window.addEventListener('wheel', this.handleMouseWheel.bind(this));

		document.addEventListener(
			'pointerlockchange',
			event => {
				this.locked = document.pointerLockElement === requestedElement;
			},
			false
		);
	}

	changeCallback() {}

	get target() {
		return this.queries.target.first.get(Transform);
	}

	get camera() {
		return this.queries.camera.first.get(Transform);
	}

	get acamera() {
		return this.queries.camera.first.get(PerspectiveCamera);
	}

	handleMouseWheel(event: WheelEvent) {
		this.zoom += event.deltaY * -0.01;
	}

	handleMouseMove(event: MouseEvent) {
		const mouse = this.locked
			? {
					x: event.movementX / 500,
					y: -event.movementY / 500
			  }
			: {
					x: (event.clientX / window.innerWidth) * 2 - 1,
					y: -(event.clientY / window.innerHeight) * 2 + 1
			  };

		const delta = this.locked
			? {
					x: mouse.x,
					y: mouse.y
			  }
			: {
					x: mouse.x - this.lastPosition.x,
					y: mouse.y - this.lastPosition.y
			  };

		this.cameraAngle.x += delta.x * 2;
		this.cameraAngle.y -= delta.y * 2;
		this.lastPosition = mouse;
	}

	public updateLate(dt: number) {
		super.updateLate(dt);

		if(!this.queries.target.first) {
			// Maybe should be an iterative system.
			console.warn("No target!");
		}

		const xAngle = -(this.cameraAngle.x * 2);
		const yAngle = this.cameraAngle.y * 6;

		const angleX = Math.cos(-xAngle) * this.zoom;
		const angleY = Math.sin(-xAngle) * this.zoom;

		this.camera.x = this.target.position.x + angleX;
		this.camera.z = this.target.position.z + angleY;
		this.camera.y = this.target.position.y + yAngle;

		this.acamera.position.set(this.camera.x, this.camera.y, this.camera.z);

		this.acamera.lookAt(this.target.position.x, this.target.position.y, this.target.position.z);
		this.acamera.quaternion.set(
			this.acamera.quaternion.x,
			this.acamera.quaternion.y,
			this.acamera.quaternion.z,
			this.acamera.quaternion.w
		);
	}
}
