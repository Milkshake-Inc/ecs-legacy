import Space from '@ecs/plugins/space/Space';
import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import {
	Mesh,
	MeshPhongMaterial,
	BufferGeometry,
	InstancedBufferGeometry,
	Matrix4,
	InstancedBufferAttribute,
	Color as ThreeColor,
	MeshBasicMaterial,
	InstancedMesh,
	DynamicDrawUsage,
	Vector3 as ThreeVector3,
	Object3D,
	PlaneBufferGeometry,
	BufferAttribute,
	Vector2
} from 'three';
import Transform from '@ecs/plugins/Transform';
import { makeNoise3D, Noise3D } from 'open-simplex-noise';
import Color from '@ecs/math/Color';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { LoadGLTF } from '@ecs/utils/ThreeHelper';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler';
import { Heightfield, Material, Box, Vec3 } from 'cannon-es';
import CannonInstancedBody from '@ecs/plugins/physics/components/CannonInstancedBody';
import { PhysicsGroup } from './Ship';

const width = 100;
const height = 100;
const detail = 1.5;
const scale = 5;

const GRASS = 0x82c62d;
const BLUE = 0x249bbd;

const flowerCount = 1000;
const flowerScale = 3;
const flowerPosition = new ThreeVector3();
const flowerNormal = new ThreeVector3();
const flowerDummy = new Object3D();

export class Terrain extends Space {
	protected noise: Noise3D;
	protected instancedStem: InstancedMesh;
	protected instancedBlossom: InstancedMesh;
	protected sampler: MeshSurfaceSampler;

	constructor(engine: Engine) {
		super(engine, 'terrain');

		this.noise = makeNoise3D(Date.now());
	}

	protected async preload() {
		const [flower] = await Promise.all([LoadGLTF('assets/prototype/models/flower.glb')]);

		const stemMesh = flower.scene.getObjectByName('Stem') as Mesh;
		const blossomMesh = flower.scene.getObjectByName('Blossom') as Mesh;
		const stemGeometry = new InstancedBufferGeometry().copy(stemMesh.geometry as BufferGeometry);
		const blossomGeometry = new InstancedBufferGeometry().copy(blossomMesh.geometry as BufferGeometry);

		const defaultTransform = new Matrix4()
			.makeRotationX(Math.PI)
			.multiply(new Matrix4().makeScale(flowerScale, flowerScale, flowerScale));

		stemGeometry.applyMatrix4(defaultTransform);
		blossomGeometry.applyMatrix4(defaultTransform);

		const stemMaterial = stemMesh.material;
		const blossomMaterial = (blossomMesh.material as unknown) as MeshBasicMaterial;
		const color = new ThreeColor();
		const colorArray = new Float32Array(flowerCount * 3);
		const blossomPalette = [0xf20587, 0xf2d479, 0xf2c879, 0xf2b077, 0xf24405];

		// Randomize color from pallete
		for (let i = 0; i < flowerCount; i++) {
			color.setHex(blossomPalette[Math.floor(Math.random() * blossomPalette.length)]);
			color.toArray(colorArray, i * 3);
		}

		blossomGeometry.setAttribute('color', new InstancedBufferAttribute(colorArray, 3));
		blossomMaterial.vertexColors = true;

		this.instancedStem = new InstancedMesh(stemGeometry, stemMaterial, flowerCount);
		this.instancedBlossom = new InstancedMesh(blossomGeometry, blossomMaterial, flowerCount);

		// Instance matrices will be updated every frame.
		this.instancedStem.instanceMatrix.setUsage(DynamicDrawUsage);
		this.instancedBlossom.instanceMatrix.setUsage(DynamicDrawUsage);
	}

	resampleParticle(i) {
		this.sampler.sample(flowerPosition, flowerNormal);

		flowerNormal.add(flowerPosition);

		flowerDummy.position.copy(flowerPosition);
		flowerDummy.scale.set(1, 1, 1);
		flowerDummy.lookAt(flowerNormal);
		flowerDummy.updateMatrix();

		this.instancedStem.setMatrixAt(i, flowerDummy.matrix);
		this.instancedBlossom.setMatrixAt(i, flowerDummy.matrix);
	}

	setup() {
		const terrain = this.getTerrain();
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

		this.addEntities(terrain, ...this.getFlowers(terrain.get(Mesh)));
	}

	getFlowers(terrainMesh: Mesh) {
		const stems = new Entity();
		stems.add(Transform, { y: -20, rx: -Math.PI / 2 });
		stems.add(this.instancedStem);
		// stems.add(CannonInstancedBody, {
		// 	options: {
		// 		collisionFilterGroup: PhysicsGroup.Flowers,
		// 		collisionFilterMask: PhysicsGroup.Player
		// 	}
		// });
		// stems.add(new Box(new Vec3(0.5, 0.5, 0.5)));

		const blossoms = new Entity();
		blossoms.add(Transform, { y: -20, rx: -Math.PI / 2 });
		blossoms.add(this.instancedBlossom);
		// blossoms.add(CannonInstancedBody, {
		// 	options: {
		// 		collisionFilterGroup: PhysicsGroup.Flowers,
		// 		collisionFilterMask: PhysicsGroup.Player
		// 	}
		// });
		// blossoms.add(new Box(new Vec3(0.5, 0.5, 0.5)));

		this.sampler = new MeshSurfaceSampler(terrainMesh).build();

		for (let i = 0; i < flowerCount; i++) {
			this.resampleParticle(i);
		}

		this.instancedStem.instanceMatrix.needsUpdate = true;
		this.instancedBlossom.instanceMatrix.needsUpdate = true;

		return [stems, blossoms];
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
		const resolution2 = 5;
		const oceanFloor = -5;

		const colors = [];

		for (let x = 0; x < widthVertices; x++) {
			for (let y = 0; y < depthVertices; y++) {
				let heightValue = 0;

				const linearNoise = (value: number) => (value + 1) / 2;

				const worldX = x * sizePerQuad;
				const worldY = y * sizePerQuad;

				const distance = new Vector3(x - (widthVertices / 2), 0, y - (widthVertices / 2)).distance(new Vector3(0, 0, 0));
				const app = (distance / 75);
				// console.log(distance);

				const easeInCubic = t => t*t*t;
				const easeInOutCubic = t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;

				const easeInExpo = (x: number): number => {
					return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
					}

				// heightValue *= ;
				heightValue += linearNoise(this.noise(worldX / 60, 0, worldY / 60)) * 120;
				heightValue += linearNoise(this.noise(worldX / resolution, 0, worldY / resolution)) * 40;

				heightValue *= (1 - app);
				heightValue += linearNoise(this.noise(worldX / 10, 0, worldY / 10)) * 5;
				heightValue = Math.max(heightValue, 0);
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
			collisionFilterGroup: PhysicsGroup.Terrain,
			collisionFilterMask: PhysicsGroup.Player
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
