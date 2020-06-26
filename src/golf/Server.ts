import { NetEngine } from '@ecs/plugins/net/NetEngine';
import { GolfRoomSystem } from './spaces/ServerGolfSpace';

const engine = new NetEngine();
engine.addSystem(new GolfRoomSystem());
// const spaces = new Entity();
// spaces.add(new ServerGolfSpace(engine, true));
// engine.addEntity(spaces);

console.log('🎉 Server');
