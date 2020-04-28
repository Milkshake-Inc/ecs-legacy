import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import { Ship } from './spaces/Ship';

const engine = new ThreeEngine();

engine.registerSpaces(new Ship(engine));

engine.getSpace('ship').open();

console.log('🎉 Client');
