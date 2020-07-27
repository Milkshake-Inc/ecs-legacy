import { NetEngine } from '@ecs/plugins/net/NetEngine';
import { ServerRoomSystem } from './systems/server/ServerRoomSystem';
import ServerDebugSystem from './systems/server/ServerDebugSystem';

const engine = new NetEngine(30);
engine.addSystem(new ServerRoomSystem());
engine.addSystem(new ServerDebugSystem());
console.log('🎉 Server');
