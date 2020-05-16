import { Entity } from '@ecs/ecs/Entity';
import RenderSystem from '@ecs/plugins/3d/systems/RenderSystem';
import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import { Fog, PCFSoftShadowMap } from 'three';
import GolfSpace from './spaces/GolfSpace';

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

const spaces = new Entity();
spaces.add(new GolfSpace(engine, true));
engine.addEntity(spaces);

console.log('🎉 Client');
