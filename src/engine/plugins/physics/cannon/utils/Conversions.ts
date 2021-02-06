import { Vec3, Quaternion as CannonQuaternion } from 'cannon-es';

export const ToCannonVector3 = (value: { x: number; y: number; z: number }) => {
    if (value instanceof Vec3) return value;
    if (!value) return undefined;
    return new Vec3(value.x, value.y, value.z);
};

export const ToCannonQuaternion = (value: { x: number; y: number; z: number; w: number }) => {
    if (value instanceof CannonQuaternion) return value;
    if (!value) return undefined;
    return new CannonQuaternion(value.x, value.y, value.z, value.w);
};