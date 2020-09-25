import { Geometry } from "pixi.js";
import { Vector2 } from "@ecs/plugins/math/Vector";

export class SimpleGeometry extends Geometry {
	static VERTEX_POSITION = 'aVertexPosition';

	private cachedVertices: Vector2[];

	constructor() {
		super();

		this.cachedVertices = [];

		this.addAttribute(SimpleGeometry.VERTEX_POSITION, [])
	}

	get vertexBuffer() {
		return this.getBuffer(SimpleGeometry.VERTEX_POSITION)
	}

	get verticies() {
		return this.cachedVertices;
	}

	set verticies(value: { x: number; y: number }[]) {
		this.cachedVertices = value;

		this.updateVerticiesBuffer()
	}

	updateVerticiesBuffer() {
		const vertices = [];

		this.cachedVertices.forEach(vertex => {
			vertices.push(vertex.x);
			vertices.push(vertex.y);
		});

		this.vertexBuffer.update(new Float32Array(vertices))
	}
}