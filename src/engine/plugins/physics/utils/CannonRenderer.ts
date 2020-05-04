import { Vec3, World, Quaternion, Body, Shape, Trimesh, Heightfield, ConvexPolyhedron, Plane, Box, Sphere } from 'cannon-es';
import {
	Scene,
	MeshBasicMaterial,
	SphereGeometry,
	BoxGeometry,
	PlaneGeometry,
	CylinderGeometry,
	Mesh,
	Geometry,
	Vector3,
	Face3
} from 'three';

/**
 * Adds Three.js primitives into the scene where all the Cannon bodies and shapes are.
 * @class CannonDebugRenderer
 * @param {THREE.Scene} scene
 * @param {CANNON.World} world
 */
export default class CannonDebugRenderer {
	tmpVec0 = new Vec3();
	tmpVec1 = new Vec3();
	tmpVec2 = new Vec3();
	tmpQuat0 = new Quaternion();

	protected scene: Scene;
	protected world: World;

	protected _meshes = [];

	_material = new MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
	_sphereGeometry = new SphereGeometry(1);
	_boxGeometry = new BoxGeometry(1, 1, 1);
	_planeGeometry = new PlaneGeometry(10, 10, 10, 10);
	_cylinderGeometry = new CylinderGeometry(1, 1, 10, 10);

	constructor(scene: Scene, world: World) {
		this.scene = scene;
		this.world = world;
	}

	update() {
		const bodies = this.world.bodies;
		const meshes = this._meshes;
		const shapeWorldPosition = this.tmpVec0;
		const shapeWorldQuaternion = this.tmpQuat0;

		let meshIndex = 0;

		for (let i = 0; i !== bodies.length; i++) {
			const body = bodies[i];

			for (let j = 0; j !== body.shapes.length; j++) {
				const shape = body.shapes[j];

				this._updateMesh(meshIndex, body, shape);

				const mesh = meshes[meshIndex];

				if (mesh) {
					// Get world position
					body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition);
					body.position.vadd(shapeWorldPosition, shapeWorldPosition);

					// Get world quaternion
					body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion);

					// Copy to meshes
					mesh.position.copy(shapeWorldPosition);
					mesh.quaternion.copy(shapeWorldQuaternion);
				}

				meshIndex++;
			}
		}

		for (let i = meshIndex; i < meshes.length; i++) {
			const mesh = meshes[i];
			if (mesh) {
				this.scene.remove(mesh);
			}
		}

		meshes.length = meshIndex;
	}

	_updateMesh(index: number, body: Body, shape: Shape) {
		let mesh = this._meshes[index];
		if (!this._typeMatch(mesh, shape)) {
			if (mesh) {
				this.scene.remove(mesh);
			}
			mesh = this._meshes[index] = this._createMesh(shape);
		}
		this._scaleMesh(mesh, shape);
	}

	_typeMatch(mesh, shape) {
		if (!mesh) {
			return false;
		}
		const geo = mesh.geometry;
		return (
			(geo instanceof SphereGeometry && shape instanceof Sphere) ||
			(geo instanceof BoxGeometry && shape instanceof Box) ||
			(geo instanceof PlaneGeometry && shape instanceof Plane) ||
			(geo.id === shape.geometryId && shape instanceof ConvexPolyhedron) ||
			(geo.id === shape.geometryId && shape instanceof Trimesh) ||
			(geo.id === shape.geometryId && shape instanceof Heightfield)
		);
	}

	_createMesh(shape) {
		let mesh;
		const material = this._material;

		switch (shape.type) {
			case Shape.types.SPHERE:
				mesh = new Mesh(this._sphereGeometry, material);
				break;

			case Shape.types.BOX:
				mesh = new Mesh(this._boxGeometry, material);
				break;

			case Shape.types.PLANE:
				mesh = new Mesh(this._planeGeometry, material);
				break;

			case Shape.types.CONVEXPOLYHEDRON: {
				// Create mesh
				const geo = new Geometry();

				// Add vertices
				for (let i = 0; i < shape.vertices.length; i++) {
					const v = shape.vertices[i];
					geo.vertices.push(new Vector3(v.x, v.y, v.z));
				}

				for (let i = 0; i < shape.faces.length; i++) {
					const face = shape.faces[i];

					// add triangles
					const a = face[0];
					for (let j = 1; j < face.length - 1; j++) {
						const b = face[j];
						const c = face[j + 1];
						geo.faces.push(new Face3(a, b, c));
					}
				}
				geo.computeBoundingSphere();
				geo.computeFaceNormals();

				mesh = new Mesh(geo, material);
				shape.geometryId = geo.id;
                break;
            }

			case Shape.types.TRIMESH: {
				console.log("render")
				const geometry = new Geometry();
				const v0 = this.tmpVec0;
				const v1 = this.tmpVec1;
				const v2 = this.tmpVec2;
				for (let i = 0; i < shape.indices.length / 3; i++) {
					shape.getTriangleVertices(i, v0, v1, v2);
					geometry.vertices.push(new Vector3(v0.x, v0.y, v0.z), new Vector3(v1.x, v1.y, v1.z), new Vector3(v2.x, v2.y, v2.z));
					const j = geometry.vertices.length - 3;
					geometry.faces.push(new Face3(j, j + 1, j + 2));
				}
				geometry.computeBoundingSphere();
				geometry.computeFaceNormals();
				mesh = new Mesh(geometry, material);
				shape.geometryId = geometry.id;
                break;
            }

			case Shape.types.HEIGHTFIELD: {
				const geometry = new Geometry();

				const v0 = this.tmpVec0;
				const v1 = this.tmpVec1;
				const v2 = this.tmpVec2;
				for (let xi = 0; xi < shape.data.length - 1; xi++) {
					for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
						for (let k = 0; k < 2; k++) {
							shape.getConvexTrianglePillar(xi, yi, k === 0);
							v0.copy(shape.pillarConvex.vertices[0]);
							v1.copy(shape.pillarConvex.vertices[1]);
							v2.copy(shape.pillarConvex.vertices[2]);
							v0.vadd(shape.pillarOffset, v0);
							v1.vadd(shape.pillarOffset, v1);
							v2.vadd(shape.pillarOffset, v2);
							geometry.vertices.push(
								new Vector3(v0.x, v0.y, v0.z),
								new Vector3(v1.x, v1.y, v1.z),
								new Vector3(v2.x, v2.y, v2.z)
							);
							const i = geometry.vertices.length - 3;
							geometry.faces.push(new Face3(i, i + 1, i + 2));
						}
					}
				}
				geometry.computeBoundingSphere();
				geometry.computeFaceNormals();
				mesh = new Mesh(geometry, material);
				shape.geometryId = geometry.id;
                break;
            }
		}

		if (mesh) {
			this.scene.add(mesh);
		}

		return mesh;
	}

	_scaleMesh(mesh: Mesh, shape: Shape) {
		switch (shape.type) {
			case Shape.types.SPHERE: {
                const radius = (shape as Sphere).radius;
				mesh.scale.set(radius, radius, radius);
				break;
            }

			case Shape.types.BOX: {
				const half = (shape as Box).halfExtents;
				mesh.scale.copy(new Vector3(half.x, half.y, half.z));
				mesh.scale.multiplyScalar(2);
                break;
            }

			case Shape.types.CONVEXPOLYHEDRON: {
				mesh.scale.set(1, 1, 1);
                break;
            }

			case Shape.types.TRIMESH: {
				const scale = (shape as Trimesh).scale;
				mesh.scale.copy(new Vector3(scale.x, scale.y, scale.z));
                break;
            }

			case Shape.types.HEIGHTFIELD: {
				mesh.scale.set(1, 1, 1);
                break;
            }
		}
	}
}
