import CannonBody from './CannonBody';
import { BodyOptions, Shape, Vec3, Quaternion as CannonQuaternion } from 'cannon-es';
import Quaternion from '@ecs/plugins/math/Quaternion';
import Vector3 from '@ecs/plugins/math/Vector';
import { ToCannonQuaternion, ToCannonVector3 } from '../utils/Conversions';

export default class CannonInstancedBody {
	constructor(public options: BodyOptions = {}, public bodies: CannonBody[] = []) { }

	addShape(shape: Shape, offset?: Vector3 | Vec3, orientation?: Quaternion | CannonQuaternion) {
		this.bodies.forEach(b => b.addShape(shape, ToCannonVector3(offset), ToCannonQuaternion(orientation)));
	}

	get position() {
		return this.options.position;
	}

	get quaternion() {
		return this.options.quaternion;
	}
}
