import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Vector3 from '@ecs/math/Vector';
import { ChunkSystem } from '@ecs/plugins/chunks/systems/ChunkSystem';
import Transform from '@ecs/plugins/Transform';
import { Mesh, MeshBasicMaterial, MeshPhongMaterial, PlaneBufferGeometry, BufferAttribute } from 'three';
import { makeNoise3D } from 'open-simplex-noise';
import Color from '@ecs/math/Color';
import PoissonDiskSampling from 'poisson-disk-sampling';
import Random from '@ecs/math/Random';
import { Heightfield, Material } from 'cannon-es';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { CollisionGroups } from '@ecs/plugins/physics/systems/CannonPhysicsSystem';

const noise = makeNoise3D(Date.now());

const GRASS = 0x82c62d;

// const islands = [
// 	new Vector3(0, 0, 0),
// 	new Vector3(1000, 0, 500),
// 	new Vector3(3000, 0, 1500),
// 	new Vector3(-2000, 0, 1500)
// ]

const pds = new PoissonDiskSampling({
    shape: [5000, 5000],
    minDistance: 1500,
    maxDistance: 4000,
    tries: 10
});


const points = pds.fill();
type Island = {
	position: Vector3;
	size: number;
	height: number;
}
const islands: Island[] = points.map(a => {
	return {
		position: new Vector3(a[0], 0, a[1]),
		size: Random.float(100, 600),
		height: Random.float(0.3, 1.7),
	}
});


const generateTerrainMesh = (chunkX: number, chunkY: number, segments = 10, size: number) => {

    const scale = size;
    const widthSegments = segments;
    const depthSegments = segments;

    const xOffset = chunkX * size;
    const yOffset = chunkY * size;

    const sizePerQuad = scale / widthSegments;

    const widthVertices = widthSegments + 1;
    const depthVertices = depthSegments + 1;

    const geometry = new PlaneBufferGeometry(scale, scale, widthSegments, depthSegments);
    const vertices = geometry.getAttribute('position').array as any;

	const colors = [];

	const heightValues = [];

	const heightMap = new Array(widthVertices).fill(0).map(() => new Array(depthVertices).fill(0));

	const chunkWorld = new Vector3(xOffset, 0, yOffset);

    for (let x = 0; x < widthVertices; x++) {
        for (let y = 0; y < depthVertices; y++) {
            const actualY = yOffset + (y * sizePerQuad);
            const actualX = xOffset + (x * sizePerQuad);

			const linearNoise = (value: number) => (value + 1) / 2;

			const resolution = 30;

			const worldX = actualX;
			const worldY = actualY;

			const world = new Vector3(worldX, 0, worldY);

			const cloests = islands.sort((a,b) => {
				return a.position.distance(world) - b.position.distance(world);
			})[0];

			const distance = new Vector3(worldX, 0, worldY).distance(cloests.position);
			let app = distance / cloests.size;
			if(app < 0) app = 0;
			if(app > 1) app = 1;

			let heightValue = 0;
			heightValue += linearNoise(noise(worldX / 60, 0, worldY / 60)) * 120;
			heightValue += linearNoise(noise(worldX / resolution, 0, worldY / resolution)) * 40;

			heightValue *= 1 - app;
			heightValue += linearNoise(noise(worldX / 10, 0, worldY / 10)) * 5;
			heightValue *= cloests.height;
			heightValue += 30;

			if (heightValue < 0) {
				// Weird issue if height are small values kicks off...
				throw 'HeightValue too small - may cause hell';
			}

			heightValues.push(heightValue)

            const vertexIndex = 3 * (x * widthVertices + y) + 2;

			vertices[vertexIndex] = heightValue;
			heightMap[x][y] = heightValue;

			let color = heightValue > 80 ? GRASS : Color.SandyBrown;
			if(heightValue > 160) color = Color.White;
			colors.push((color >> 16) & 255);
			colors.push((color >> 8) & 255);
			colors.push(color & 255);
        }
	}

	const isAboveWater = heightValues.filter(a => a > 60);
	if(isAboveWater.length == 0) {
		return null;
	}

	geometry.setAttribute('color', new BufferAttribute(new Uint8Array(colors), 3, true));
    // Recalculate normals for lighting
    geometry.computeVertexNormals();

    return {
		geometry,
		heightMap
	};
}

const terrainMaterial = new Material('Terrain');
terrainMaterial.friction = 0.03;

export default class TerrainChunkSystem extends ChunkSystem {
	constructor(engine: Engine) {
		super(engine, 500 / 2, 5000, 16);
	}

	updateChunkLod(chunk: Entity, x: number, y: number, lodLevel: number, chunksize: number) {
		const mesh = chunk.get(Mesh);
		if(!mesh) return;

		const material = mesh.material as MeshBasicMaterial;

		// mesh.geometry.dispose();

		// (mesh.material as MeshBasicMaterial).wireframe = true;
		if (lodLevel == 0) {
			// material.color.set(Color.White);
			const stuff = generateTerrainMesh(y, x, 120 / 2, chunksize);
			mesh.geometry = stuff.geometry;

			if(mesh.geometry) {
				chunk.add(new Heightfield(stuff.heightMap, {
					elementSize: chunksize/ (120 / 2)
				}));
				chunk.add(new CannonBody({
					material: terrainMaterial,
					collisionFilterGroup: ~CollisionGroups.Default,
					collisionFilterMask: ~CollisionGroups.Characters | CollisionGroups.Vehicles
				}))
			}

		}

		if (lodLevel > 1) {
			chunk.remove(Heightfield);
			chunk.remove(CannonBody);
		}

		if (lodLevel == 1) {
			// material.color.set(Color.Blue);
			mesh.geometry = generateTerrainMesh(y, x, 80 / 2, chunksize).geometry;
		}

		if (lodLevel == 2) {
			// material.color.set(Color.Orange);
			mesh.geometry = generateTerrainMesh(y, x, 40 / 2, chunksize).geometry;
		}

		if (lodLevel == 3) {
			// material.color.set(Color.Red);
			mesh.geometry = generateTerrainMesh(y, x, 20, chunksize).geometry;
		}

		if (lodLevel >= 4) {
			// material.color.set(Color.Black);
			mesh.geometry = generateTerrainMesh(y, x, 10, chunksize).geometry;
		}

		// if (lodLevel > 4) {
		// 	// material.color.set(Color.Navy);
		// 	mesh.geometry = generateTerrainMesh(y, x, 5, chunksize);
		// }

		// mesh.visible = false;
	}

	createChunk(chunkX: number, chunkZ: number, lod: number, size): Entity {
		const worldPosition = new Vector3(chunkX * this.chunkSize, 0, chunkZ * this.chunkSize);

		const chunk = new Entity();
		chunk.add(Transform, { position: worldPosition.clone(), rx: -Math.PI / 2 });

		const apple = generateTerrainMesh(chunkZ, chunkX, 10, size);

		if(apple && apple.geometry) {
				chunk.add(
					new Mesh(
						apple.geometry,
						new MeshPhongMaterial({
							// map: texture,
							flatShading: true,
							reflectivity: 0,
							specular: 0,
							shininess: 0,
							vertexColors: true
							// wireframe: true,
						})
					)
				);
			}

		return chunk;
	}
}
