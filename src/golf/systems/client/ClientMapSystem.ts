import { System } from '@ecs/ecs/System';
import { useSimpleEvents, useSingletonQuery } from '@ecs/ecs/helpers';
import { useGolfNetworking, GolfPacketOpcode } from '../../constants/GolfNetworking';
import { CREATE_CHAT_MSG } from './ClientChatBoxSystem';
import { KenneyAssetsGLTF } from '../../constants/GolfAssets';
import { Engine } from '@ecs/ecs/Engine';
import { deserializeMap } from '../../utils/Serialization';
import Random from '@ecs/math/Random';
import * as QueryString from 'query-string';
import { Views } from '@ecs/plugins/reactui/View';

export default class ClientMapSystem extends System {
	events = useSimpleEvents();
	protected views = useSingletonQuery(this, Views);

	network = useGolfNetworking(this, {
		connect: () => {
			console.warn('Connected');

			setTimeout(() => {
				this.views().open('lobby');
			}, 1000);

			setTimeout(() => {
				if (this.room) {
					this.joinRoom(this.room);
				} else {
					console.log('Sending ALL_GAMES_REQUEST');
					this.network.send({
						opcode: GolfPacketOpcode.ALL_GAMES_REQUEST
					});
				}
			}, 0);

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
			console.log('Join random game: ' + randomGame);
			this.joinRoom(randomGame);
		});
	}

	joinRoom(roomId: string) {
		console.log('Joining room: ' + roomId);

		this.room = roomId;

		this.network.send({
			opcode: GolfPacketOpcode.JOIN_GAME,
			roomId
		});
	}

	get room() {
		return QueryString.parse(location.search).room as string;
	}

	set room(roomId: string) {
		const query = QueryString.stringify({
			...QueryString.parse(location.search),
			room: roomId
		});
		const path = location.pathname;
		history.replaceState(history.state, '', `${path}?${query}`);
	}
}
