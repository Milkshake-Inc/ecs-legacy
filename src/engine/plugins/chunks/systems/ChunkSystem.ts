import { System } from "@ecs/ecs/System";
import { Engine } from "@ecs/ecs/Engine";
import { Entity } from "@ecs/ecs/Entity";
import Transform from "@ecs/plugins/Transform";
import { Mesh, SphereGeometry, MeshBasicMaterial } from "three";
import ThirdPersonTarget from "@ecs/plugins/3d/systems/ThirdPersonTarget";
import Vector3 from "@ecs/math/Vector";
import ChunkData from "../components/ChunkData";
import { useQueries } from "@ecs/ecs/helpers";
import { all } from "@ecs/utils/QueryHelper";
import ChunkViewer from "../components/ChunkViewer";


export abstract class ChunkSystem extends System {

    protected engine: Engine;

    protected chunkSize: number;
    protected maxViewDistance: number;
    protected chunksVisibleInView: number;
    protected lodLevels: number;

    private chunks = new Map<string, Entity>();

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
    }

    get viewerPosition() {
        const viewer = this.queries.viewer.first;

        if(!viewer) {
            return null;
        }

        return viewer.get(Transform).position;
    }

    calculateLOD(distance: number): number {
        return Math.floor((distance / this.maxViewDistance) * (this.lodLevels));
    }



    update(deltaTime: number) {

        if(this.viewerPosition == null) {
            console.log("No Viewer");
            return;
        }

        const currentChunkX = Math.round(this.viewerPosition.x / this.chunkSize);
        const currentChunkZ = Math.round(this.viewerPosition.z / this.chunkSize);

        // Maybe check once the player has moved distance and not every frame
        const chunksToRemove = new Set(this.chunks.keys());

        for (let zOffset = -this.chunksVisibleInView; zOffset < this.chunksVisibleInView; zOffset++) {
            for (let xOffset = -this.chunksVisibleInView; xOffset < this.chunksVisibleInView; xOffset++) {
                const chunkPosition = new Vector3(currentChunkX + xOffset, 0, currentChunkZ + zOffset);
                const chunkWorldPosition = chunkPosition.multiF(this.chunkSize);

                const distance = chunkWorldPosition.distance(new Vector3(this.viewerPosition.x, 0, this.viewerPosition.z));
                const levelOfDetail = this.calculateLOD(distance);

                const chunkKey = `X:${chunkPosition.x}_Y:${chunkPosition.z}`;

                if(distance < this.maxViewDistance) {

                    if(!this.chunks.has(chunkKey)) {

                        const chunk = this.createChunk(chunkPosition, chunkWorldPosition, -1, this.chunkSize);

                        chunk.add(ChunkData, {
                            lod: -1,
                        });

                        // console.log(`Creating chunk at ${chunkKey}`)

                        this.chunks.set(chunkKey, chunk);

                        this.engine.addEntity(chunk);
                    }

                    const chunk = this.chunks.get(chunkKey);

                    const currentLOD = chunk.get(ChunkData).lod;

                    if(levelOfDetail != currentLOD) {
                        this.updateChunkLod(chunk, chunkPosition.x, chunkPosition.z, levelOfDetail, this.chunkSize);
                    }

                    chunk.get(ChunkData).lod = levelOfDetail;

                    chunksToRemove.delete(chunkKey);
                }
            }
        }

        chunksToRemove.forEach((chunkKey) => {
            const chunk = this.chunks.get(chunkKey);
            this.chunks.delete(chunkKey);
            this.engine.removeEntity(chunk);
        });

    }

    abstract updateChunkLod(chunk: Entity, x: number, y: number, lodLevel: number, chunksize: number);
    abstract createChunk(chunkPosition: Vector3, chunkWorldPosition: Vector3, lod: number, size): Entity;
}