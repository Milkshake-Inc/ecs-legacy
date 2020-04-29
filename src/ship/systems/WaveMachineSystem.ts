import { Entity } from '@ecs/ecs/Entity';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { Geometry, Mesh, MeshPhongMaterial } from 'three';
import SeaWaves from '../components/SeaWaves';

export const getWaveHeight = (x: number, z: number, elaspedTime: number) => {
	return Math.sin(elaspedTime * 0.0005 + x * 0.2) * 0.25 + Math.sin(elaspedTime * 0.0002 + z * 0.2) * 0.5;
};

export default class WaveMachineSystem extends IterativeSystem {
	protected elaspedTime = 0;

	constructor() {
		super(makeQuery(all(SeaWaves, Mesh)));
	}

	updateEntity(entity: Entity, deltaTime: number) {
		this.elaspedTime += deltaTime;

		const mesh = entity.get(Mesh);

		if(mesh.material instanceof MeshPhongMaterial){
			mesh.material.map.repeat.x = 25 + (Math.sin(this.elaspedTime / 2000) * 0.1)
			mesh.material.map.repeat.y = 25 + (Math.cos(this.elaspedTime / 1600) * 0.1)
		}

		if (mesh.geometry instanceof Geometry) {
			mesh.geometry.vertices.forEach(verticies => {
				verticies.y = getWaveHeight(verticies.x, verticies.z, this.elaspedTime);
			});

			mesh.geometry.verticesNeedUpdate = true;
		}
	}
}
