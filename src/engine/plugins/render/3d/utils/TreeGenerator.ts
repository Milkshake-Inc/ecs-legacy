import Random from '@ecs/plugins/math/Random';
import Transform from '@ecs/plugins/math/Transform';
import { Vector } from '@ecs/plugins/math/Vector';
import { Object3D, Vector3 as ThreeVector3 } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Entity } from 'tick-knock';
import { generateInstancedMesh, getMeshByMaterialName } from './MeshUtils';

export const treeGenerator = (
	bounds: Vector,
	models: GLTF[],
	config = {
		count: 300,
		minScale: 2,
		maxScale: 3,
		leafColors: [0x29c9ab, 0x2ba6aa, 0x6e925c],
		woodColors: [0xb56845, 0x723434, 0xc96152]
	}
) => {
	const dummy = new Object3D();
	const varieties = models.map(t => {
		const leafMesh = getMeshByMaterialName(t.scene, 'leaf');
		const woodMesh = getMeshByMaterialName(t.scene, 'wood');

		return {
			leafMesh: generateInstancedMesh(leafMesh, config.count / models.length, config.leafColors),
			woodMesh: generateInstancedMesh(woodMesh, config.count / models.length, config.woodColors),
			index: 0
		};
	});

	for (let i = 0; i < config.count; i++) {
		const position = new ThreeVector3(0, 0, 0);
		const treeVariety = varieties[i % varieties.length];

		position.x += Random.float(0, bounds.x);
		position.z += Random.float(0, bounds.z);

		dummy.position.copy(position);
		dummy.rotateY(Random.float(-Math.PI, Math.PI));
		dummy.scale.setScalar(Random.int(config.minScale, config.maxScale));
		dummy.updateMatrix();

		treeVariety.leafMesh.setMatrixAt(treeVariety.index, dummy.matrix);
		treeVariety.woodMesh.setMatrixAt(treeVariety.index, dummy.matrix);
		treeVariety.index++;
	}

	const entities: Entity[] = [];

	varieties.forEach(v => {
		const leaf = new Entity();
		leaf.add(Transform);
		leaf.add(v.leafMesh);

		const wood = new Entity();
		wood.add(Transform);
		wood.add(v.woodMesh);

		entities.push(leaf, wood);
	});

	return entities;
};
