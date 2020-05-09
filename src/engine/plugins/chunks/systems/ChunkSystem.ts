import { System } from '@ecs/ecs/System';
import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Transform from '@ecs/plugins/Transform';
import Vector3 from '@ecs/math/Vector';
import ChunkData from '../components/ChunkData';
import { useQueries } from '@ecs/ecs/helpers';
import { all } from '@ecs/utils/QueryHelper';
import ChunkViewer from '../components/ChunkViewer';

export abstract class ChunkSystem extends System {
	protected engine: Engine;

	protected chunkSize: number;
	protected maxViewDistance: number;
	protected chunksVisibleInView: number;
	protected lodLevels: number;

	private chunks = new Map<string, Entity>();

	// private viewerDebug: Entity;

	private queries = useQueries(this, {
		viewer: all(ChunkViewer)
	});

	constructor(engine: Engine, chunkSize = 20, maxViewDistance = 100, lodLevels = 6) {
		super();

		this.engine = engine;

		this.chunkSize = chunkSize;
		this.maxViewDistance = maxViewDistance;
		this.chunksVisibleInView = Math.round(maxViewDistance / chunkSize);
		this.lodLevels = lodLevels;

		// this.viewerDebug = new Entity();
		// this.viewerDebug.add(Transform);
		// this.viewerDebug.add(
		//     new Mesh(
		//         new SphereGeometry(1),
		//         new MeshBasicMaterial({
		//             color: 0xff0000,
		//             wireframe: false,
		//         })
		//     )
		// )
		// this.viewerDebug.add(ThirdPersonTarget);
		// engine.addEntity(this.viewerDebug);
	}

	update(deltaTime: number) {
		// const viewerTransform = this.viewerDebug.get(Transform).position;
		// // viewerTransform.x += 0.1 * 3;

		const viewer = this.queries.viewer.first;

		if (!viewer) {
			console.log('No viewer');
			return;
		}
		const viewerTransform = viewer.get(Transform);

		const currentChunkX = Math.round(viewerTransform.x / this.chunkSize);
		const currentChunkZ = Math.round(viewerTransform.z / this.chunkSize);

		const chunksToRemove = new Set(this.chunks.keys());

		for (let zOffset = -this.chunksVisibleInView; zOffset < this.chunksVisibleInView; zOffset++) {
			for (let xOffset = -this.chunksVisibleInView; xOffset < this.chunksVisibleInView; xOffset++) {
				const currentChunk = new Vector3(currentChunkX + xOffset, 0, currentChunkZ + zOffset);

				const currentChunkWorld = currentChunk.multiF(this.chunkSize);
				const distance = currentChunkWorld.distance(new Vector3(viewerTransform.x, 0, viewerTransform.z));
				const lodLevel = Math.floor((distance / this.maxViewDistance) * this.lodLevels);

				const chunkKey = `X:${currentChunk.x}_Y:${currentChunk.z}`;

				if (distance < this.maxViewDistance) {
					if (!this.chunks.has(chunkKey)) {
						const chunk = this.createChunk(currentChunk.x, currentChunk.z, -1, this.chunkSize);

						chunk.add(ChunkData, {
							lod: -1
						});

						console.log(`Creating chunk at ${chunkKey}`);

						this.chunks.set(chunkKey, chunk);

						this.engine.addEntity(chunk);
					}

					const chunk = this.chunks.get(chunkKey);

					const currentLOD = chunk.get(ChunkData).lod;

					if (lodLevel != currentLOD) {
						this.updateChunkLod(chunk, currentChunk.x, currentChunk.z, lodLevel, this.chunkSize);
					}

					chunk.get(ChunkData).lod = lodLevel;

					chunksToRemove.delete(chunkKey);
				}
			}
		}

		chunksToRemove.forEach(chunkKey => {
			const chunk = this.chunks.get(chunkKey);
			this.chunks.delete(chunkKey);
			this.engine.removeEntity(chunk);
		});
	}

	abstract updateChunkLod(chunk: Entity, x: number, y: number, lodLevel: number, chunksize: number);
	//  {
	//     const mesh = chunk.get(Mesh);
	//     const material = mesh.material as MeshBasicMaterial;

	//     if(lodLevel == 0) {
	//         // material.color.set(new Color("green"));
	//         mesh.geometry = generateTerrainMesh(y, x, 12, chunksize)
	//     }

	//     if(lodLevel == 1) {
	//         // material.color.set(new Color("yellow"));
	//         mesh.geometry = generateTerrainMesh(y, x, 8, chunksize)
	//     }

	//     if(lodLevel >= 2) {
	//         // material.color.set(new Color("orange"));
	//         mesh.geometry = generateTerrainMesh(y, x, 6, chunksize)
	//     }
	// }

	abstract createChunk(chunkX: number, chunkZ: number, lod: number, size): Entity;
	// / {
	// const worldPosition = new Vector3(chunkX * this.chunkSize, 0, chunkZ * this.chunkSize);

	// const chunk = new Entity();
	// chunk.add(Transform, { position: worldPosition.clone(), rx: -Math.PI / 2 });

	// chunk.add(new Mesh(
	//     generateTerrainMesh(chunkZ, chunkX, 10, size),
	//     new MeshPhongMaterial({
	//         map: texture,
	//         flatShading: true,
	//         reflectivity: 0,
	//         specular: 0,
	//         shininess: 0,
	//         // wireframe: true,

	//     })
	// ))
	// chunk.add(ChunkData, {
	//     lod
	// })
	// return chunk;
	// }
}
