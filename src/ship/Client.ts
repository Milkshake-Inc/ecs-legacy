import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import { Ship } from './spaces/Ship';
import ShipRenderSystem from './systems/ShipRenderSystem';

const engine = new ThreeEngine(new ShipRenderSystem());

engine.registerSpaces(new Ship(engine));

engine.getSpace('ship').open();

console.log('🎉 Client');
