/* eslint-disable no-mixed-spaces-and-tabs */
import { useQueries, useState } from '@ecs/core/helpers';
import { System } from '@ecs/core/System';
import Keyboard from '@ecs/plugins/input/Keyboard';
import Vector3 from '@ecs/plugins/math/Vector';
import Transform from '@ecs/plugins/math/Transform';
import { all } from '@ecs/core/Query';
import { PerspectiveCamera } from 'three';
import { Engine } from '@ecs/core/Engine';
import Input from '@ecs/plugins/input/components/Input';
import { Key } from '@ecs/plugins/input/Control';

export default class FreeRoamCameraSystem extends System {
	private lastPosition = { x: 0, y: 0 };
	private cameraAngle: Vector3 = Vector3.ZERO;
	private keyboard = new Keyboard();

	private locked = false;

	protected queries = useQueries(this, {
		camera: all(Transform, PerspectiveCamera)
	});

	protected inputs = useState(
		this,
		new Input({
			boost: Keyboard.key(Key.Shift),
			up: Keyboard.key(Key.Q),
			down: Keyboard.key(Key.E),
			left: Keyboard.key(Key.A),
			right: Keyboard.key(Key.D),
			back: Keyboard.key(Key.S),
			forward: Keyboard.key(Key.W)
		})
	);

	constructor(protected bindLockToBody = true) {
		super();
	}

	onAddedToEngine(engine: Engine) {
		if (this.bindLockToBody) {
			const requestedElement = document.body;

			requestedElement.addEventListener('click', () => {
				document.body.requestPointerLock();
			});
		}

		document.body.addEventListener('mousemove', this.handleMouseMove.bind(this));

		document.addEventListener(
			'pointerlockchange',
			event => {
				this.locked = document.pointerLockElement != null;
			},
			false
		);
	}

	get camera() {
		return this.queries.camera.first?.get(Transform);
	}

	handleMouseMove(event: MouseEvent) {
		event.preventDefault();
		if (!this.camera) return;

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
					x: 0,
					y: 0
			  };

		this.cameraAngle.x += delta.x * 2;
		this.cameraAngle.y -= delta.y * 2;

		this.camera.quaternion.setFromAxisAngle(Vector3.UP, -this.cameraAngle.x);
		this.camera.quaternion.multiplyFromAxisAngle(Vector3.LEFT, this.cameraAngle.y);

		this.lastPosition = mouse;
	}

	public updateLate(dt: number) {
		super.updateLate(dt);
		const camera = this.queries.camera.first.get(Transform);

		const speed = this.inputs.state.boost.down ? 1 : 0.1;
		let movement = Vector3.ZERO;

		if (this.inputs.state.forward.down) {
			movement = movement.add(camera.quaternion.multiV(Vector3.FORWARD));
		}

		if (this.inputs.state.back.down) {
			movement = movement.add(camera.quaternion.multiV(Vector3.BACKWARD));
		}

		if (this.inputs.state.left.down) {
			movement = movement.add(camera.quaternion.multiV(Vector3.LEFT));
		}

		if (this.inputs.state.right.down) {
			movement = movement.add(camera.quaternion.multiV(Vector3.RIGHT));
		}

		if (this.inputs.state.up.down) {
			movement = movement.add(camera.quaternion.multiV(Vector3.UP));
		}

		if (this.inputs.state.down.down) {
			movement = movement.add(camera.quaternion.multiV(Vector3.DOWN));
		}

		camera.position = camera.position.add(movement.multiF(speed));
	}
}
