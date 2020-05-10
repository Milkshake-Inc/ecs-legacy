import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import { ShipClient } from './spaces/ShipClient';
import ShipRenderSystem from './systems/ShipRenderSystem';
import { Terrain } from './spaces/Terrain';
import { Entity } from '@ecs/ecs/Entity';
import { ShipBase } from './spaces/ShipBase';

const ui = document.createElement('div');
ui.innerText = 'Press C to switch objects';
document.body.prepend(ui);

const engine = new ThreeEngine(new ShipRenderSystem());

const spaces = new Entity();
spaces.add(new ShipBase(engine, true));
spaces.add(new ShipClient(engine, true));
spaces.add(new Terrain(engine, true));
engine.addEntity(spaces);

console.log('🎉 Client');
