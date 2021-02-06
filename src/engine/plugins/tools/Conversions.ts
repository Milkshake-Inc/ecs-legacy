import { Quaternion as ThreeQuaternion, Vector3 as ThreeVector3 } from 'three';
import Vector3 from '@ecs/plugins/math/Vector';
import Quaternion from '@ecs/plugins/math/Quaternion';

export const ToThreeVector3 = (value: { x: number; y: number; z: number }) => {
	if (value instanceof ThreeVector3) return value;
	if (!value) return undefined;
	return new ThreeVector3(value.x, value.y, value.z);
};

export const ToVector3 = (value: { x: number; y: number; z: number }) => {
	if (value instanceof Vector3) return value;
	if (!value) return undefined;
	return new Vector3(value.x, value.y, value.z);
};

export const ToThreeQuaternion = (value: { x: number; y: number; z: number; w: number }) => {
	if (value instanceof ThreeQuaternion) return value;
	if (!value) return undefined;
	return new ThreeQuaternion(value.x, value.y, value.z, value.w);
};

export const ToQuaternion = (value: { x: number; y: number; z: number; w: number }) => {
	if (value instanceof Quaternion) return value;
	if (!value) return undefined;
	return new Quaternion(value.x, value.y, value.z, value.w);
};
