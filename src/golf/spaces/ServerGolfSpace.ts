
import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { System } from '@ecs/ecs/System';
import Session from '@ecs/plugins/net/components/Session';
import { GolfPacketOpcode, GolfPackets, useGolfNetworking } from '../constants/GolfNetworking';
import { Maps } from '../constants/Maps';
import BaseGolfSpace from './BaseGolfSpace';

export default class ServerGolfSpace extends BaseGolfSpace {
	constructor(engine: Engine, open = false) {
        super(engine, open);

        console.log("Server")
    }

    setup() {
        super.setup();

        this.addSystem(new ServerMapSystem());
    }
}

class ServerMapSystem extends System {
    network = useGolfNetworking(this, {
        connect: (e) => this.handleConnection(e)
    })

    constructor() {
        super()
    }

    handleConnection(entity: Entity) {
        const session = entity.get(Session);

        session.socket.send<GolfPackets>({
            opcode: GolfPacketOpcode.SEND_MAP,
            data: Maps.DefaultMap,
            name: "Default Map"
        }, true);
    }
}