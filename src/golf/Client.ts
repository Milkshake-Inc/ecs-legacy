import { Entity } from '@ecs/ecs/Entity';
import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import GolfSpace from './spaces/GolfSpace';
import GolfRenderSystem from './systems/GolfRenderSystem';

const engine = new ThreeEngine(new GolfRenderSystem());

const spaces = new Entity();
spaces.add(new GolfSpace(engine, true));
engine.addEntity(spaces);

console.log('🎉 Client');
