import { ThreeEngine } from '@ecs/plugins/3d/ThreeEngine';
import { Ship } from './spaces/Ship';
import ShipRenderSystem from './systems/ShipRenderSystem';
import { Terrain } from './spaces/Terrain';
import { Entity } from '@ecs/ecs/Entity';

const ui = document.createElement('div');
ui.innerText = 'Press C to switch objects';
document.body.prepend(ui);

const engine = new ThreeEngine(new ShipRenderSystem());

const spaces = new Entity();
spaces.add(new Ship(engine));
spaces.add(new Terrain(engine));
engine.addEntity(spaces);

spaces.get(Ship).open();
spaces.get(Terrain).open();

console.log('🎉 Client');
