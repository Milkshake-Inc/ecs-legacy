import { NetEngine } from '@ecs/plugins/net/NetEngine';
import ServerDebugSystem from './systems/server/ServerDebugSystem';
import { ServerRoomSystem } from './systems/server/ServerRoomSystem';

const engine = new NetEngine(30);
engine.addSystem(new ServerRoomSystem());
engine.addSystem(new ServerDebugSystem());
console.log('🎉 Server');
