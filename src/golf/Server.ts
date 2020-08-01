import { NetEngine } from '@ecs/plugins/net/NetEngine';
import { setAmmo as setupAmmoInstance } from '@ecs/plugins/physics/ammo/AmmoPhysicsSystem';
import Ammo from 'ammojs-typed';
import ServerDebugSystem from './systems/server/ServerDebugSystem';
import { ServerRoomSystem } from './systems/server/ServerRoomSystem';

// TODO
// Bit of a hack to initialise Ammo before starting the engine
// Maybe systems can have a async "setup" function?
Ammo(Ammo).then((ammo) => {
    setupAmmoInstance(ammo);

    const engine = new NetEngine(30);
    engine.addSystem(new ServerRoomSystem());
    engine.addSystem(new ServerDebugSystem());
    console.log('🎉 Server');
});