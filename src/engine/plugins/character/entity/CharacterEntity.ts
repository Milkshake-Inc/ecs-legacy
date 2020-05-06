import { Entity } from '@ecs/ecs/Entity';
import Input from '@ecs/plugins/input/components/Input';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Transform from '@ecs/plugins/Transform';
import { Material, ContactMaterial } from 'cannon-es';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import Vector3 from '@ecs/math/Vector';
import GLTFHolder from '../../3d/components/GLTFHolder';
import CharacterTag from './../components/CharacterTag';
import CapsuleShape from '@ecs/plugins/physics/components/CapsuleShape';

export const characterMaterial = new Material('characterMaterial');
characterMaterial.friction = 0.5;
characterMaterial.restitution = 0;

export const boatMaterial = new Material('boatMaterial');
boatMaterial.friction = 0.5;
boatMaterial.restitution = 0;

export const contactMaterial = new ContactMaterial(characterMaterial, boatMaterial, {
	friction: 1
});

export default class CharacterEntity extends Entity {
	constructor(gtlf: GLTF, spawnPosition: Vector3 = Vector3.ZERO) {
		super();

		this.add(Transform, { position: spawnPosition, ry: 2 });
		this.add(GLTFHolder, { value: gtlf });
		this.add(CharacterTag);
		this.add(Input);
		this.add(gtlf.scene);
		this.add(contactMaterial);
		this.add(
			new CannonBody({
				mass: 1,
				material: characterMaterial,
				fixedRotation: true
			}),
			{
				offset: new Vector3(0, -0.2, 0)
			}
		);

		this.add(new CapsuleShape(1, 0.2));
	}
}
