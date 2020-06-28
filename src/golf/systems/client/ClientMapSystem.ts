import { System } from '@ecs/ecs/System';
import { useSimpleEvents } from '@ecs/ecs/helpers';
import { useGolfNetworking, GolfPacketOpcode } from '../../constants/GolfNetworking';
import { CREATE_CHAT_MSG } from './ClientChatBoxSystem';
import { KenneyAssetsGLTF } from '../../constants/GolfAssets';
import { Engine } from '@ecs/ecs/Engine';
import { deserializeMap } from '../../utils/Serialization';
import Random from '@ecs/math/Random';

export default class ClientMapSystem extends System {
	events = useSimpleEvents();

	network = useGolfNetworking(this, {
		connect: () => {

			setTimeout(() => {
				console.log("Sending ALL_GAMES_REQUEST	")
				this.network.send({
					opcode: GolfPacketOpcode.ALL_GAMES_REQUEST
				});
			}, 0)

			this.events.emit(CREATE_CHAT_MSG, 'Connected');
		},
		disconnect: () => {
			this.events.emit(CREATE_CHAT_MSG, 'Disconnected');
		}
	});

	assets: KenneyAssetsGLTF;

	constructor(assets: KenneyAssetsGLTF) {
		super();

		this.assets = assets;
	}

	onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);

		this.network.on(GolfPacketOpcode.SEND_MAP, data => {
			engine.addEntities(...deserializeMap(this.assets, data.data));
		});

		this.network.on(GolfPacketOpcode.ALL_GAMES_RESPONSE, data => {
			const randomGame = Random.fromArray(data.games);
			console.log("Join random game: " + randomGame)
			this.network.send({
				opcode: GolfPacketOpcode.JOIN_GAME,
				roomId: randomGame,
			})
		})
	}
}
