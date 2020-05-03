import Space from '@ecs/plugins/space/Space';
import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { PlaneGeometry, Mesh, MeshPhongMaterial, PlaneBufferGeometry, BufferAttribute } from 'three';
import Transform from '@ecs/plugins/Transform';
import { makeNoise3D, Noise3D } from 'open-simplex-noise';
import Vector3 from '@ecs/math/Vector';
import Color from '@ecs/math/Color';
import { Body, Heightfield, Material } from 'cannon';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';

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


		const terrain = this.getGeometry();
		// terrain.get(Transform).scale.set(5, 5, 5);
		// terrain.add(Transform, { y: -10, z: -20, rx: -Math.PI / 2, scale: Vector3.EQUAL(scale) });
		// terrain.add(mesh);
		// terrain.add(new Body());

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

	getGeometry(): Entity {
		const scale = 100 * 5;
		const widthSegments = 150;
		const depthSegments = 150;

		const sizePerQuad = scale / widthSegments;

		const widthVertices = widthSegments + 1;
		const depthVertices = depthSegments + 1;

		const geometry = new PlaneBufferGeometry(scale, scale, widthSegments, depthSegments);
		const vertices = geometry.getAttribute('position').array as any;



		const heightMap = new Array(widthVertices).fill(0).map(() => new Array(depthVertices).fill(0));

		const resolution = 30;
		const resolution2 = 5;
		const oceanFloor = -5;

		const colors = [];

		for (let x = 0; x < widthVertices; x++) {
			for (let y = 0; y < depthVertices; y++) {
				let heightValue = 0;

				const linearNoise = (value: number) => (value + 1) / 2;

				const worldX = (x * sizePerQuad);
				const worldY = (y * sizePerQuad);

				heightValue += linearNoise(this.noise(worldX / resolution, 0, worldY / resolution)) * 20 * 2;
				// heightValue += linearNoise(this.noise(worldX / resolution2, 0, worldY / resolution2));
				// if (v.z < oceanFloor) {
				// 	v.z = oceanFloor;
				// }

				const color = heightValue > 30 ? GRASS : Color.SandyBrown;
				colors.push((color >> 16) & 255);
				colors.push((color >> 8) & 255);
				colors.push(color & 255);

				//this.noise(v.x / resolution, v.z / resolution, v.y / resolution) * 20;

				if (heightValue < 0) {
					// Weird issue if height are small values kicks off...
					throw 'HeightValue too small - may cause hell';
				}

				const vertexIndex = 3 * (x * widthVertices + y) + 2;

				vertices[vertexIndex] = heightValue;
				heightMap[x][y] = heightValue;
			}
		}

		geometry.setAttribute( 'color', new BufferAttribute(new Uint8Array(colors), 3, true ) );

		// Recalculate normals for lighting
		geometry.computeVertexNormals();

		const heightfield = new Heightfield(heightMap as any, {
			elementSize: sizePerQuad
		});

		const terrainMaterial = new Material("Terrain");
		terrainMaterial.friction = 0.03;

		const terrain = new Entity();
		terrain.add(Transform, { y: -20, rx: -Math.PI / 2 });
		terrain.add(
			new Mesh(
				geometry,
				new MeshPhongMaterial({
					flatShading: true,
					reflectivity: 0,
					specular: 0,
					wireframe: false,
					vertexColors: true,
				})
			)
		);
		terrain.add(new CannonBody(), {
			material: terrainMaterial
		});
		terrain.add(heightfield);

		return terrain;



		// geometry.faces.forEach(f => {
		// 	//get three verts for the face
		// 	const a = geometry.vertices[f.a];
		// 	const b = geometry.vertices[f.b];
		// 	const c = geometry.vertices[f.c];

		// 	//if average is below water, set to 0
		// 	//alt: color transparent to show the underwater landscape
		// 	// const avgz = (a.z + b.z + c.z) / 3;
		// 	// if (avgz < 0) {
		// 	// 	a.z = 0;
		// 	// 	b.z = 0;
		// 	// 	c.z = 0;
		// 	// }

		// 	//assign colors based on the highest point of the face
		// 	const max = Math.max(a.z, Math.max(b.z, c.z));
		// 	if (max <= 0) return f.color.set(BLUE);
		// 	if (max <= 1.5) return f.color.set(BLUE);
		// 	if (max <= 5) return f.color.set(Color.SandyBrown);
		// 	if (max <= 8) return f.color.set(GRASS);

		// 	//otherwise, return white
		// 	f.color.set('white');
		// });
	}

	getMaterial() {
		return new MeshPhongMaterial({
			wireframe: false,
			vertexColors: true,
			flatShading: true
		});
	}
}
