import Ammo from 'ammojs-typed';
import { setAmmo } from '@ecs/plugins/physics/ammo/AmmoLoader';

Ammo(Ammo).then(ammo => {
	setAmmo(ammo);
	require('./Client');
});
