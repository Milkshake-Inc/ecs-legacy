import { Entity } from '@ecs/ecs/Entity';
import Position from '../Position';
import Camera from './components/Camera';

export function DefaultCamera() {
	const camera = new Entity();
	camera.add(Position);
	camera.add(Camera, { width: 1280, height: 720, zoom: 1 });
}
