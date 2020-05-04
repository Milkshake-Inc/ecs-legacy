import { Entity } from '@ecs/ecs/Entity';
import Vector3 from '@ecs/math/Vector';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Transform from '@ecs/plugins/Transform';
import { Heightfield } from 'cannon-es';
import { Mesh, MeshPhongMaterial, PlaneBufferGeometry, RepeatWrapping } from 'three';
import BaseSpace from './../BaseSpace';

export default class TerrainSpace extends BaseSpace {
	setup() {
		super.setup();

		this.addSystem(new ThirdPersonCameraSystem());

		const scale = 10;
		const widthSegments = 30;
		const depthSegments = 30;

		const sizePerQuad = scale / widthSegments;

		const widthVertices = widthSegments + 1;
		const depthVertices = depthSegments + 1;

		const geometry = new PlaneBufferGeometry(scale, scale, widthSegments, depthSegments);
		const vertices = geometry.getAttribute('position').array as any;

		const heightMap = new Array(widthVertices).fill(0).map(() => new Array(depthVertices).fill(0));

		for (let x = 0; x < widthVertices; x++) {
			for (let y = 0; y < depthVertices; y++) {
				const heightValue = (1 + (Math.sin(y / 3) + Math.cos(x / 3)) / 2) * 2;

				if (heightValue < 0) {
					// Weird issue if height are small values kicks off...
					throw 'HeightValue too small - may cause hell';
				}

				const vertexIndex = 3 * (x * widthVertices + y) + 2;

				vertices[vertexIndex] = heightValue;
				heightMap[x][y] = heightValue;

				if (Math.random() > 0.8) {
					this.addEntity(this.createBall(new Vector3(-(scale / 2) + x * sizePerQuad, 5, -(scale / 2) + y * sizePerQuad)));
				}
			}
		}

		// Recalculate normals for lighting
		geometry.computeVertexNormals();

		const heightfield = new Heightfield(heightMap as any, {
			elementSize: sizePerQuad
		});

		// Scale texture up - repeat each segment
		this.purpleTexture.repeat.set(widthSegments, depthSegments);
		this.purpleTexture.wrapS = this.purpleTexture.wrapT = RepeatWrapping;

		const terrain = new Entity();
		terrain.add(ThirdPersonTarget);
		terrain.add(Transform, { rx: -Math.PI / 2 });
		terrain.add(
			new Mesh(
				geometry,
				new MeshPhongMaterial({
					map: this.purpleTexture,
					flatShading: true,
					reflectivity: 0,
					specular: 0
				})
			)
		);
		terrain.add(new CannonBody());
		terrain.add(heightfield);

		this.addEntities(terrain);
	}
}
