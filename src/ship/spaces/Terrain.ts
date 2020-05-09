import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Color from '@ecs/math/Color';
import Random from '@ecs/math/Random';
import Vector3 from '@ecs/math/Vector';
import { generateInstancedMesh, getMeshByMaterialName } from '@ecs/plugins/3d/utils/meshUtils';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { Heightfield, Material } from 'cannon-es';
import { makeNoise3D, Noise3D } from 'open-simplex-noise';
import { BufferAttribute, InstancedMesh, Mesh, MeshPhongMaterial, Object3D, PlaneBufferGeometry, Vector3 as ThreeVector3 } from 'three';
import { CollisionGroups } from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import TerrainChunkSystem from '../systems/TerrainChunkSystem';

const GRASS = 0x82c62d;
const Seed = 1589029789694;

type TreeGenerator = {
	count: number;
	minScale: number;
	maxScale: number;
	leafColors: number[];
	dummy: Object3D;
	varieties: {
		leafMesh: InstancedMesh;
		woodMesh: InstancedMesh;
		index: 0;
	}[];
};

export class Terrain extends Space {
	protected noise: Noise3D;
	protected trees: TreeGenerator;

	constructor(engine: Engine) {
		super(engine, 'terrain');

		this.noise = makeNoise3D(Seed);
		this.trees = {
			count: 3000,
			minScale: 5,
			maxScale: 8,
			leafColors: [GRASS, 0x76b02e, 0x96b02e, 0xbcd84d],
			dummy: new Object3D(),
			varieties: []
		};
	}

	protected async preload() {
		const trees = await Promise.all([
			LoadGLTF('assets/prototype/models/trees/tree_oak.glb'),
			LoadGLTF('assets/prototype/models/trees/tree_detailed.glb'),
			LoadGLTF('assets/prototype/models/trees/tree_cone.glb'),
			LoadGLTF('assets/prototype/models/trees/tree_default.glb'),
			LoadGLTF('assets/prototype/models/trees/tree_fat.glb')
		]);

		this.trees.varieties = trees.map(t => {
			return {
				leafMesh: generateInstancedMesh(
					getMeshByMaterialName(t.scene, 'leafsGreen'),
					this.trees.count / trees.length,
					this.trees.leafColors
				),
				woodMesh: generateInstancedMesh(getMeshByMaterialName(t.scene, 'woodBark'), this.trees.count / trees.length, [
					0x844734,
					0x7b444a
				]),
				index: 0
			};
		});
	}

	setup() {
		this.addSystem(new TerrainChunkSystem(this.worldEngine));

		// const terrain = this.getTerrain();

		// this.trees.varieties.forEach(v => {
		// 	const leaf = new Entity();
		// 	leaf.add(Transform, { y: -20 });
		// 	leaf.add(v.leafMesh);

		// 	const wood = new Entity();
		// 	wood.add(Transform, { y: -20 });
		// 	wood.add(v.woodMesh);

		// 	this.addEntities(leaf, wood);
		// });

		// this.addEntities(terrain);
	}

	getTerrain(): Entity {
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

		const colors = [];

		this.trees.varieties.forEach(v => (v.index = 0));

		for (let x = 0; x < widthVertices; x++) {
			for (let y = 0; y < depthVertices; y++) {
				let heightValue = 0;

				const linearNoise = (value: number) => (value + 1) / 2;

				const worldX = x * sizePerQuad;
				const worldY = y * sizePerQuad;

				const distance = new Vector3(x - widthVertices / 2, 0, y - widthVertices / 2).distance(new Vector3(0, 0, 0));
				const app = distance / 75;
				// console.log(distance);

				// heightValue *= ;
				heightValue += linearNoise(this.noise(worldX / 60, 0, worldY / 60)) * 120;
				heightValue += linearNoise(this.noise(worldX / resolution, 0, worldY / resolution)) * 40;

				heightValue *= 1 - app;
				heightValue += linearNoise(this.noise(worldX / 10, 0, worldY / 10)) * 5;
				heightValue = Math.max(heightValue, 0);
				// if (v.z < oceanFloor) {
				// 	v.z = oceanFloor;
				// }

				const color = heightValue > 30 ? GRASS : Color.SandyBrown;
				colors.push((color >> 16) & 255);
				colors.push((color >> 8) & 255);
				colors.push(color & 255);

				const treeVariety = Random.seed(Seed).fromArray(this.trees.varieties);

				if (heightValue > 30 && treeVariety.index < treeVariety.leafMesh.count) {
					const noise = linearNoise(this.noise(worldX / 30, 0, worldY / 30)) + linearNoise(this.noise(worldX, 0, worldY)) / 4;

					if (noise > 0.6) {
						const position = new ThreeVector3(worldY - scale / 2, heightValue, worldX - scale / 2);
						position.x += Random.seed(Seed).float(-1, 1);
						position.z += Random.seed(Seed).float(-1, 1);
						this.trees.dummy.position.copy(position);
						this.trees.dummy.rotateY(Random.seed(Seed).float(-Math.PI, Math.PI));

						this.trees.dummy.scale.setScalar(Random.seed(Seed).int(this.trees.minScale, this.trees.maxScale));
						this.trees.dummy.updateMatrix();

						treeVariety.leafMesh.setMatrixAt(treeVariety.index, this.trees.dummy.matrix);
						treeVariety.woodMesh.setMatrixAt(treeVariety.index, this.trees.dummy.matrix);
						treeVariety.index++;
					}
				}

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

		geometry.setAttribute('color', new BufferAttribute(new Uint8Array(colors), 3, true));

		// Recalculate normals for lighting
		geometry.computeVertexNormals();

		const heightfield = new Heightfield(heightMap as any, {
			elementSize: sizePerQuad
		});

		const terrainMaterial = new Material('Terrain');
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
					vertexColors: true
				})
			)
		);
		terrain.add(new CannonBody(), {
			material: terrainMaterial,
			collisionFilterGroup: ~CollisionGroups.Default,
			collisionFilterMask: ~CollisionGroups.Characters | CollisionGroups.Vehicles
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
}
