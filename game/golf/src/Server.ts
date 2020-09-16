import Ammo from 'ammojs-typed';
import { setAmmo } from '@ecs/plugins/physics/ammo/AmmoLoader';

// TODO
// Bit of a hack to initialise Ammo before starting the engine
// Maybe systems can have a async "setup" function?
Ammo(Ammo).then(ammo => {
	setAmmo(ammo);
	require('./ServerGame');
});