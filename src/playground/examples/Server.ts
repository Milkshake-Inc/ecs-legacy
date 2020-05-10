import { NetEngine } from '@ecs/plugins/net/NetEngine';
import { Entity } from '@ecs/ecs/Entity';
import { NetworkServerSpace } from './spaces/network/NetworkServerSpace';

const engine = new NetEngine();
const spaces = new Entity();
spaces.add(new NetworkServerSpace(engine, true));
engine.addEntity(spaces);

console.log('🎉 Server');
