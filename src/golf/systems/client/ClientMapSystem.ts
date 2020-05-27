import { System } from "@ecs/ecs/System";
import { useSimpleEvents } from "@ecs/ecs/helpers";
import { useGolfNetworking, GolfPacketOpcode } from "../../constants/GolfNetworking";
import { CREATE_CHAT_MSG } from "../ChatBoxSystem";
import { KenneyAssetsGLTF } from "../../components/GolfAssets";
import { Engine } from "@ecs/ecs/Engine";
import { deserializeMap } from "../../utils/Serialization";

export default class ClientMapSystem extends System {
	events = useSimpleEvents();

    network = useGolfNetworking(this, {
		connect: () => {
			this.events.emit(CREATE_CHAT_MSG, "Connected");
		},
		disconnect: () => {
			this.events.emit(CREATE_CHAT_MSG, "Disconnected");
		}
	})

	assets: KenneyAssetsGLTF;

    constructor(assets: KenneyAssetsGLTF) {
		super()

		this.assets = assets;
	}

	onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);

		this.network.on(GolfPacketOpcode.SEND_MAP, (data) => {
			engine.addEntities(...deserializeMap(this.assets, data.data));
		})
    }
}