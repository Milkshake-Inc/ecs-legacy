import { Entity } from '@ecs/ecs/Entity';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import Transform from '@ecs/plugins/Transform';
import * as isosurface from "isosurface";
import { Face3, Geometry, Mesh, MeshPhongMaterial, Vector3 as ThreeVector3 } from "three";
import BaseSpace from './../BaseSpace';
import FreeRoamCameraSystem from '@ecs/plugins/3d/systems/FreeRoamCameraSystem';
import { makeNoise3D } from 'open-simplex-noise';
// import * as Cannon from 'cannon-es';
import MeshShape from '@ecs/plugins/physics/components/MeshShape';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import { Body, Trimesh, Shape } from 'cannon-es';
import Vector3 from '@ecs/math/Vector';

export default class VoxelSpace extends BaseSpace {
	setup() {
		super.setup();

		this.addSystem(new FreeRoamCameraSystem());

        const noise = makeNoise3D(Math.random());

        const d = 64;
        const dims = [d, d, d];
        const b = 1.5;
        const bounds = [[-b, -b, -b ], [b, b, b]];
        const map = function({x,y,z}: ThreeVector3) {
            return (x*x + y*y + z*z) - noise(x*2,y*2,z*2);
        };

        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                this.addEntities(this.createBall(new Vector3(x, 20 + (x*y), y), 0.25));
            }
        }


        // result['Perlin Noise'] = makeVolume(
        //     [[-5, 5, 0.25],
        //      [-5, 5, 0.25],
        //      [-5, 5, 0.25]],
        //     function(x,y,z) {
        //       return PerlinNoise.noise(x,y,z) - 0.5;
        //     }
        //   );

        const mesh = new IsosurfaceGeometry(dims, map, bounds);
        const body = new Body();

        const terrain = new Entity();
        terrain.add(Transform, { y: 8, sx: 10, sy: 10, sz: 10 });
		terrain.add(new Mesh(
            mesh,
            new MeshPhongMaterial({
                flatShading: true,
            })
        ));

        const verts = [];
        mesh.vertices.forEach((v) => {
            verts.push(v.x * 10, v.y * 10, v.z * 10);
        })

        const indie = [];
        mesh.faces.forEach((v) => {
            indie.push(v.a, v.b, v.c);
        })

        terrain.add(body)
        // body.addShape(Trimesh.createTorus(1, 2, 10, 10, 1))
        body.addShape(new Trimesh(verts, indie))
        // terrain.add()




		this.addEntities(terrain);
	}
}


export class IsosurfaceGeometry extends Geometry {

    constructor(dims, map, bounds) {
        super()

        const p = new ThreeVector3();

        const compatibleMap = function(x, y, z) {
            return map(p.fromArray([x, y, z]))
        };

        const result = isosurface.marchingCubes(dims, compatibleMap, bounds)

        let v, f;

        for (let i = 0; i < result.positions.length; ++i) {
            v = result.positions[i];
            this.vertices.push(new ThreeVector3().fromArray(v));
        }

        for (let i = 0; i < result.cells.length; ++i) {
            f = result.cells[i];
            if (f.length === 3) {
                this.faces.push(new Face3(f[0], f[1], f[2]));
            } else if (f.length === 4) {
                this.faces.push(new Face3(f[0], f[1], f[2]));
                this.faces.push(new Face3(f[0], f[2], f[3]));
            }
        }

        this.mergeVertices();

        const s = 0.001;
        const tinyChangeX = new ThreeVector3( s, 0, 0 );
        const tinyChangeY = new ThreeVector3( 0, s, 0 );
        const tinyChangeZ = new ThreeVector3( 0, 0, s );

        let upTinyChangeInX, upTinyChangeInY, upTinyChangeInZ;
        let downTinyChangeInX, downTinyChangeInY, downTinyChangeInZ;
        let tinyChangeInX, tinyChangeInY, tinyChangeInZ;

        const vertexNormals = [];

        for (let i = 0; i < this.vertices.length; ++i) {
            const vertex = this.vertices[i];

            upTinyChangeInX   = map( vertex.clone().add(tinyChangeX) );
            downTinyChangeInX = map( vertex.clone().sub(tinyChangeX) );
            tinyChangeInX = upTinyChangeInX - downTinyChangeInX;

            upTinyChangeInY   = map( vertex.clone().add(tinyChangeY) );
            downTinyChangeInY = map( vertex.clone().sub(tinyChangeY) );
            tinyChangeInY = upTinyChangeInY - downTinyChangeInY;

            upTinyChangeInZ   = map( vertex.clone().add(tinyChangeZ) );
            downTinyChangeInZ = map( vertex.clone().sub(tinyChangeZ) );
            tinyChangeInZ = upTinyChangeInZ - downTinyChangeInZ;

            const normal = new ThreeVector3(tinyChangeInX, tinyChangeInY, tinyChangeInZ);
            normal.normalize();
            vertexNormals.push(normal);
        }

        for (let i = 0; i < this.faces.length; ++i) {
            f = this.faces[i];
            f.vertexNormals = [
                vertexNormals[f.a],
                vertexNormals[f.b],
                vertexNormals[f.c]
            ];
        }
    }


}