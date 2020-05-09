import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Color from '@ecs/math/Color';
import Random from '@ecs/math/Random';
import Vector3 from '@ecs/math/Vector';
import { ChunkSystem } from '@ecs/plugins/chunks/systems/ChunkSystem';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { CollisionGroups } from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Transform from '@ecs/plugins/Transform';
import { Heightfield, Material } from 'cannon-es';
import { makeNoise3D } from 'open-simplex-noise';
import PoissonDiskSampling from 'poisson-disk-sampling';
import { BufferAttribute, Mesh, MeshPhongMaterial, PlaneBufferGeometry } from 'three';

const noise = makeNoise3D(Date.now());

const GRASS = 0x82c62d;

const pds = new PoissonDiskSampling({
	shape: [5000, 5000],
	minDistance: 1500,
	maxDistance: 4000,
	tries: 10,
	rng: Math.random()
});

const points = pds.fill();
type Island = {
	position: Vector3;
	size: number;
	height: number;
};
const islands: Island[] = points.map(a => {
	return {
		position: new Vector3(a[0], 0, a[1]),
		size: Random.float(100, 600),
		height: Random.float(0.3, 1.7)
	};
});

const create2DArray = <T>(width: number, depth: number, initialValue: T) => {
	return new Array<T>(width).fill(undefined).map(() => new Array<T>(depth).fill({ ...initialValue }));
};

class TerrainData {
	public heightMap: {
		heightData: number[][];
		colorData: number[][];
		width: number;
		height: number;
	};
	public isAboveWater: boolean;
}

const linearNoise = (value: number) => (value + 1) / 2;

const time = (name: string, callback: () => void) => {
	const time = performance.now();
	callback();
	const timeElapsed = Math.round(performance.now() - time);
	console.log(`⏱  ${name} - ElapsedTime ${timeElapsed}ms`);
};

const shouldGenerateChunk = (chunkX: number, chunkY: number, size: number): boolean => {
	const chunkWorldX = chunkX * size;
	const chunkWorldY = chunkY * size;

	const chunkWorldPosition = new Vector3(chunkWorldX, 0, chunkWorldY);

	const closestIsland = islands.sort((a, b) => {
		return a.position.distance(chunkWorldPosition) - b.position.distance(chunkWorldPosition);
	})[0];

	const chunkCenter = new Vector3(chunkWorldX + size / 2, 0, chunkWorldY + size / 2);

	return closestIsland.position.distance(chunkCenter) < closestIsland.size + size;
};

const generateTerrainData = (chunkX: number, chunkY: number, segments = 10, size: number): TerrainData => {
	const scale = size;
	const widthSegments = segments;
	const depthSegments = segments;

	const xOffset = chunkX * size;
	const yOffset = chunkY * size;

	const sizePerQuad = scale / widthSegments;

	const widthVertices = widthSegments + 1;
	const depthVertices = depthSegments + 1;

	const heightValues = [];

	const heightMap = create2DArray(widthVertices, depthVertices, 0);
	const colorMap = create2DArray(widthVertices, depthVertices, 0xffffff);

	for (let x = 0; x < widthVertices; x++) {
		for (let y = 0; y < depthVertices; y++) {
			const actualY = yOffset + y * sizePerQuad;
			const actualX = xOffset + x * sizePerQuad;

			const resolution = 30;

			const worldX = actualX;
			const worldY = actualY;

			const world = new Vector3(worldX, 0, worldY);

			const cloests = islands.sort((a, b) => {
				return a.position.distance(world) - b.position.distance(world);
			})[0];

			const distance = new Vector3(worldX, 0, worldY).distance(cloests.position);

			// const distance
			let app = distance / cloests.size;
			if (app < 0) app = 0;
			if (app > 1) app = 1;

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

			heightValues.push(heightValue);

			let color = heightValue > 80 ? GRASS : Color.SandyBrown;
			if (heightValue > 160) color = Color.White;

			heightMap[x][y] = heightValue;
			colorMap[x][y] = color;
		}
	}

	// This could be "loest point etc"
	const isAboveWater = heightValues.filter(a => a > 60).length != 0;

	const result = new TerrainData();
	result.heightMap = {
		heightData: heightMap,
		colorData: colorMap,
		width: widthVertices,
		height: depthVertices
	};
	result.isAboveWater = isAboveWater;

	return result;
};

const generateTerrainMesh = (terrainData: TerrainData, chunkSize: number, qualityDivision = 1) => {
	const widthVertices = (terrainData.heightMap.width - 1) / qualityDivision;
	const heightVertices = (terrainData.heightMap.height - 1) / qualityDivision;

	const geometry = new PlaneBufferGeometry(chunkSize, chunkSize, widthVertices, heightVertices);
	const vertices = geometry.getAttribute('position').array as any;
	const colors = [];

	for (let x = 0; x < widthVertices + 1; x++) {
		for (let y = 0; y < heightVertices + 1; y++) {
			const vertexIndex = 3 * (x * (widthVertices + 1) + y) + 2;

			const height = terrainData.heightMap.heightData[x * qualityDivision][y * qualityDivision];
			vertices[vertexIndex] = height;

			const color = terrainData.heightMap.colorData[x * qualityDivision][y * qualityDivision];
			colors.push((color >> 16) & 255);
			colors.push((color >> 8) & 255);
			colors.push(color & 255);
		}
	}

	geometry.setAttribute('color', new BufferAttribute(new Uint8Array(colors), 3, true));

	// Recalculate normals for lighting
	geometry.computeVertexNormals();

	return geometry;
};

const terrainMaterial = new Material('Terrain');
terrainMaterial.friction = 0.03;

export default class TerrainChunkSystem extends ChunkSystem {
	constructor(engine: Engine) {
		super(engine, 500 / 2, 5000, 16);
	}

	createChunk(chunkPosition: Vector3, worldPosition: Vector3, lod: number, size): Entity {
		const chunk = new Entity();
		chunk.add(Transform, { position: worldPosition.clone(), rx: -Math.PI / 2 });

		const create = shouldGenerateChunk(chunkPosition.z, chunkPosition.x, size);

		if (create) {
			time('Heightmap generation', () => {
				const terrainData = generateTerrainData(chunkPosition.z, chunkPosition.x, 60, size);

				if (terrainData.isAboveWater) {
					chunk.add(terrainData);
				} else {
					// After generating terrain we found out most of it is under water
				}
			});
		} else {
			// Too far from an island to be land
		}

		return chunk;
	}

	updateChunkLod(chunk: Entity, x: number, y: number, lodLevel: number, chunksize: number) {
		if (chunk.has(TerrainData)) {
			const terrainData = chunk.get(TerrainData);

			if (!chunk.has(Mesh)) {
				console.log('Generating initial mesh');
				chunk.add(
					new Mesh(
						new PlaneBufferGeometry(chunksize, chunksize, 1, 1),
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

			const mesh = chunk.get(Mesh);

			// Physics
			if (lodLevel == 0) {
				chunk.add(
					new Heightfield(terrainData.heightMap.heightData, {
						elementSize: chunksize / 60
					})
				);
				chunk.add(
					new CannonBody({
						material: terrainMaterial,
						collisionFilterGroup: ~CollisionGroups.Default,
						collisionFilterMask: ~CollisionGroups.Characters | CollisionGroups.Vehicles
					})
				);
			}

			if (lodLevel > 1) {
				chunk.remove(Heightfield);
				chunk.remove(CannonBody);
			}

			// Geometry
			mesh.geometry.dispose();

			if (lodLevel == 0) {
				mesh.geometry = generateTerrainMesh(chunk.get(TerrainData), chunksize, 1); // 60
			}

			if (lodLevel == 1) {
				mesh.geometry = generateTerrainMesh(chunk.get(TerrainData), chunksize, 1); // 60
			}

			if (lodLevel == 2) {
				mesh.geometry = generateTerrainMesh(chunk.get(TerrainData), chunksize, 2); // 30
			}

			if (lodLevel == 3) {
				mesh.geometry = generateTerrainMesh(chunk.get(TerrainData), chunksize, 6); // 15
			}

			if (lodLevel == 4) {
				mesh.geometry = generateTerrainMesh(chunk.get(TerrainData), chunksize, 6); // 10
			}

			if (lodLevel > 4) {
				mesh.geometry = generateTerrainMesh(chunk.get(TerrainData), chunksize, 6); // 6
			}
		}
	}
}
