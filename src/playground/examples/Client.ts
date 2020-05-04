import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import Color from '@ecs/math/Color';
import Random from '@ecs/math/Random';
import Vector3 from '@ecs/math/Vector';
import RenderSystem from '@ecs/plugins/3d/systems/RenderSystem';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import CharacterEntity from '@ecs/plugins/character/entity/CharacterEntity';
import CharacterControllerSystem from '@ecs/plugins/character/systems/CharacterControllerSystem';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import BoundingBoxShape from '@ecs/plugins/physics/components/BoundingBoxShape';
import CannonPhysicsSystem from '@ecs/plugins/physics/systems/CannonPhysicsSystem';
import Space from '@ecs/plugins/space/Space';
import Transform from '@ecs/plugins/Transform';
import { LoadGLTF, LoadTexture } from '@ecs/utils/ThreeHelper';
import { Body, Material, Plane, Vec3, Box, Heightfield, Sphere as CannonSphere } from 'cannon-es';
import { AmbientLight, BoxGeometry, Color as ThreeColor, DirectionalLight, Fog, Mesh, MeshPhongMaterial, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, RepeatWrapping, Texture, Sphere, SphereGeometry, PlaneBufferGeometry } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import BaseSpace from './BaseSpace';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import Quaternion from '@ecs/math/Quaternion';
import TerrainSpace from './spaces/TerrainSpace';
import CharacterSpace from './spaces/CharacterSpace';
import VoxelSpace from './spaces/VoxelSpace';

const engine = new ThreeEngine(
	new RenderSystem({
		color: 0x262626,
		configure: (renderer, scene) => {
			// renderer.setPixelRatio(2);
			renderer.shadowMap.type = PCFSoftShadowMap;
			renderer.shadowMap.enabled = true;

			scene.fog = new Fog(0x262626, 10, 200);
		}
	})
);

engine.registerSpaces(new TerrainSpace(engine, "terrain"));
engine.registerSpaces(new CharacterSpace(engine, "animation"));
engine.registerSpaces(new VoxelSpace(engine, "voxel"));


engine.getSpace('terrain').open();

console.log('🎉 Client');
