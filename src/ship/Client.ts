import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import { Ship } from './spaces/Ship';
import ShipRenderSystem from './systems/ShipRenderSystem';
import { Terrain } from './spaces/Terrain';

const engine = new ThreeEngine(new ShipRenderSystem());

engine.registerSpaces(new Ship(engine), new Terrain(engine));

engine.getSpace('ship').open();
engine.getSpace('terrain').open();

console.log('🎉 Client');
