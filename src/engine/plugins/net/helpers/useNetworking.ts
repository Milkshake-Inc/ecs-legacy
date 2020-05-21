import { Engine } from "@ecs/ecs/Engine";
import { Entity } from "@ecs/ecs/Entity";
import { System } from "@ecs/ecs/System";
import { all, makeQuery } from "@ecs/utils/QueryHelper";
import Session from "../components/Session";
import { Packet, PacketOpcode } from "../components/Packet";

type NetworkingCallbacks = {
    connect?: (entity: Entity) => void;
    disconnect?: (entity: Entity) => void;
}

export const useNetworking = (system: System, callbacks?: NetworkingCallbacks) => {

    const sessionQuery = makeQuery(all(Session));

    const packetHandlers: ((packet: Packet) => void)[] = [];

	const onAddedCallback = (engine: Engine) => {
		engine.addQuery(sessionQuery);
    };

    const handlePacket = (entity: Entity, packet: Packet) => {
        packetHandlers.forEach((packetHandle) => packetHandle(packet));
    }

    sessionQuery.onEntityAdded.connect((snapshot) => {
        if(callbacks?.connect) {
            callbacks.connect(snapshot.entity);
        }

        // Bind to packets - NOT update synced.
        const session = snapshot.entity.get(Session);
        session.socket.handleImmediate((packet) => handlePacket(snapshot.entity, packet));
    })

    sessionQuery.onEntityRemoved.connect((snapshot) => {
        if(callbacks?.disconnect) {
            callbacks.disconnect(snapshot.entity);
        }
    })

	system.signalOnAddedToEngine.connect(onAddedCallback);
    system.signalOnRemovedFromEngine.disconnect(onAddedCallback);

    type PacketsOfType<T extends PacketOpcode> = Extract<Packet, { opcode: T }>;

    return {
        on: <T extends PacketOpcode>(opcode: T, onPacket: (packet: PacketsOfType<T>) => void) => {
            const hanlderFunction = (packet: Packet) => {
                if (packet.opcode === opcode) {
                    onPacket(packet as PacketsOfType<T>);
                }
            }
            packetHandlers.push(hanlderFunction);
        }
    }
};