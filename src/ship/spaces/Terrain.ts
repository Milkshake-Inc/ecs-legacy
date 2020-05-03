import Space from '@ecs/plugins/space/Space';
import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { PlaneGeometry, Mesh, MeshPhongMaterial } from 'three';
import Transform from '@ecs/plugins/Transform';
import { makeNoise3D, Noise3D } from 'open-simplex-noise';
import Vector3 from '@ecs/math/Vector';
import Color from '@ecs/math/Color';
import { Body } from 'cannon';

const width = 100;
const height = 100;
const detail = 1.5;
const scale = 5;

const GRASS = 0x82c62d;
const BLUE = 0x249bbd;

export class Terrain extends Space {
	protected noise: Noise3D;

	constructor(engine: Engine) {
		super(engine, 'terrain');

		this.noise = makeNoise3D(Date.now());
	}

	setup() {
		const geometry = this.getGeometry();
		const mesh = new Mesh(geometry, this.getMaterial());

		const terrain = new Entity();
		terrain.add(Transform, { y: -10, z: -20, rx: -Math.PI / 2, scale: Vector3.EQUAL(scale) });
		terrain.add(mesh);
		terrain.add(new Body());

		// TODO Figure out heightmap stuffs
		// const tempHeightMap = [];
		// for (let x = 0; x < width; x++) {
		// 	tempHeightMap[x] = [];
		// 	for (let y = 0; y < height; y++) {
		// 		tempHeightMap[x][y] = geometry.vertices[height - x + width * y].z;
		// 	}
		// }
		// debugger;
		// terrain.add(
		// 	new Heightfield(tempHeightMap as any, {
		// 		elementSize: scale
		// 	})
		// );

		this.addEntities(terrain);
	}

	getGeometry() {
		const resolution = 30;
		const resolution2 = 5;
		const oceanFloor = -5;
		const geometry = new PlaneGeometry(width, height, width * detail, height * detail);

		geometry.vertices.forEach((v, i) => {
			v.z = this.noise(v.x / resolution, v.z / resolution, v.y / resolution) * 20;

			if (v.z < oceanFloor) {
				v.z = oceanFloor;
			}

			v.z += this.noise(v.x / resolution2, v.z / resolution2, v.y / resolution2) * 1;

			// UNCOMMENT FOR COOL RIVERS
			// v.z = Math.abs(v.z);
		});

		geometry.faces.forEach(f => {
			//get three verts for the face
			const a = geometry.vertices[f.a];
			const b = geometry.vertices[f.b];
			const c = geometry.vertices[f.c];

			//if average is below water, set to 0
			//alt: color transparent to show the underwater landscape
			// const avgz = (a.z + b.z + c.z) / 3;
			// if (avgz < 0) {
			// 	a.z = 0;
			// 	b.z = 0;
			// 	c.z = 0;
			// }

			//assign colors based on the highest point of the face
			const max = Math.max(a.z, Math.max(b.z, c.z));
			if (max <= 0) return f.color.set(BLUE);
			if (max <= 1.5) return f.color.set(BLUE);
			if (max <= 5) return f.color.set(Color.SandyBrown);
			if (max <= 8) return f.color.set(GRASS);

			//otherwise, return white
			f.color.set('white');
		});

		return geometry;
	}

	getMaterial() {
		return new MeshPhongMaterial({
			wireframe: false,
			vertexColors: true,
			flatShading: true
		});
	}
}
