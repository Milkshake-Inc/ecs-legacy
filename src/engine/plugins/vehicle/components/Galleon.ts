import { Mesh } from 'three';

export type GalleonData = {
	FrontCannon?: Mesh;
	LeftCannon?: Mesh;
	RigthCannon?: Mesh;
	SteeringWheel?: Mesh;
};

export default class Galleon {
	data: GalleonData;
}
