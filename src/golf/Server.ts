import { NetEngine } from '@ecs/plugins/net/NetEngine';
import { Entity } from '@ecs/ecs/Entity';
import ServerGolfSpace from './spaces/ServerGolfSpace';

const engine = new NetEngine();
const spaces = new Entity();
spaces.add(new ServerGolfSpace(engine, true));
engine.addEntity(spaces);

console.log('🎉 Server');
