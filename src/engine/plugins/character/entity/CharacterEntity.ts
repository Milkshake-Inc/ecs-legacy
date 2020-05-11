import { Entity } from '@ecs/ecs/Entity';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Transform from '@ecs/plugins/Transform';
import { Material, ContactMaterial } from 'cannon-es';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import Vector3 from '@ecs/math/Vector';
import GLTFHolder from '../../3d/components/GLTFHolder';
import CharacterTag from './../components/CharacterTag';
import CapsuleShape from '@ecs/plugins/physics/components/CapsuleShape';
import { CollisionGroups } from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import InputKeybindings from '@ecs/plugins/input/components/InputKeybindings';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { SkinnedMesh, Bone, Skeleton } from 'three';
import { CharacterAnimation } from '../systems/CharacterAnimateSystem';
export const characterMaterial = new Material('characterMaterial');
characterMaterial.friction = 0.5;
characterMaterial.restitution = 0;

export const boatMaterial = new Material('boatMaterial');
boatMaterial.friction = 0.5;
boatMaterial.restitution = 0;

export const contactMaterial = new ContactMaterial(characterMaterial, boatMaterial, {
	friction: 1
});

export class BaseCharacterEntity extends Entity {
	constructor(spawnPosition: Vector3 = Vector3.ZERO) {
		super();

		this.add(Transform, { position: spawnPosition, ry: 2 });
		this.add(CharacterTag);
		this.add(contactMaterial);
		this.add(
			new CannonBody({
				mass: 1,
				material: characterMaterial,
				fixedRotation: true,
				collisionFilterGroup: ~CollisionGroups.Characters,
				collisionFilterMask: ~CollisionGroups.Default | CollisionGroups.Vehicles,
				allowSleep: false
			}),
			{
				offset: new Vector3(0, -0.2, 0)
			}
		);

		this.add(new CapsuleShape(1, 0.2));
	}
}

export default class ClientCharacterEntity extends Entity {
	constructor(gtlf: GLTF, spawnPosition: Vector3 = Vector3.ZERO) {
		super();

		// Need to look into
		const cloneHack = cloneGltf(gtlf);
		const clonedGtlf = SkeletonUtils.clone(gtlf.scene);
		cloneHack.scene = clonedGtlf as any;

		this.add(Transform, { position: spawnPosition, ry: 2 });
		this.add(GLTFHolder, { value: cloneHack as any });
		this.add(CharacterTag);
		this.add(clonedGtlf);
		this.add(contactMaterial);
		this.add(CharacterAnimation);
		this.add(
			new CannonBody({
				mass: 1,
				material: characterMaterial,
				fixedRotation: true,
				collisionFilterGroup: ~CollisionGroups.Characters,
				collisionFilterMask: ~CollisionGroups.Default | CollisionGroups.Vehicles,
				allowSleep: false
			}),
			{
				offset: new Vector3(0, -0.2, 0)
			}
		);

		this.add(new CapsuleShape(1, 0.2));
	}
}

const cloneGltf = (gltf: GLTF) => {
	const clone = {
		animations: gltf.animations,
		scene: gltf.scene.clone(true)
	};

	const skinnedMeshes = {};

	gltf.scene.traverse(node => {
		if (node instanceof SkinnedMesh) {
			skinnedMeshes[node.name] = node;
		}
	});

	const cloneBones = {};
	const cloneSkinnedMeshes: { [index: string]: any } = {};

	clone.scene.traverse(node => {
		if (node instanceof Bone) {
			cloneBones[node.name] = node;
		}

		if (node instanceof SkinnedMesh) {
			cloneSkinnedMeshes[node.name] = node;
		}
	});

	for (const name in skinnedMeshes) {
		const skinnedMesh = skinnedMeshes[name];
		const skeleton = skinnedMesh.skeleton;
		const cloneSkinnedMesh = cloneSkinnedMeshes[name];

		const orderedCloneBones = [];

		for (let i = 0; i < skeleton.bones.length; ++i) {
			const cloneBone = cloneBones[skeleton.bones[i].name];
			orderedCloneBones.push(cloneBone);
		}

		cloneSkinnedMesh.bind(new Skeleton(orderedCloneBones, skeleton.boneInverses), cloneSkinnedMesh.matrixWorld);
	}

	return clone;
};
