import { NetEngine } from '@ecs/plugins/net/NetEngine';
import { ServerRoomSystem } from './systems/server/ServerRoomSystem';

const engine = new NetEngine();
engine.addSystem(new ServerRoomSystem());

console.log('🎉 Server');
