
import { Engine } from '@ecs/ecs/Engine';
import BaseGolfSpace from './BaseGolfSpace';


export default class ServerGolfSpace extends BaseGolfSpace {
	constructor(engine: Engine, open = false) {
        super(engine, open);

        console.log("Server")
    }
}
