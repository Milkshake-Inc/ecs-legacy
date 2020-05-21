
import { Engine } from '@ecs/ecs/Engine';
import BaseGolfSpace from './BaseGolfSpace';
import { useNetworking } from '@ecs/plugins/net/helpers/useNetworking';
import { System } from '@ecs/ecs/System';
import { Entity } from '@ecs/ecs/Entity';
import Session from '@ecs/plugins/net/components/Session';
import { PacketOpcode } from '@ecs/plugins/net/components/Packet';

export enum GolfPacketOpcode {
	SEND_MAP = 6,
}

export type ServerSendMap = {
	opcode: GolfPacketOpcode.SEND_MAP;
	map: string;
};

export type GolfPackets = ServerSendMap;

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
    network = useNetworking(this, {
        connect: (e) => this.handleConnection(e)
    })

    constructor() {
        super()
    }

    handleConnection(entity: Entity) {
        const session = entity.get(Session);
        session.socket.send<GolfPackets>({
            opcode: GolfPacketOpcode.SEND_MAP,
            map: "cool_map_bro"
        });
    }
}