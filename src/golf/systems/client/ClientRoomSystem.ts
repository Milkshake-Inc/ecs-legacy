import { System } from '@ecs/ecs/System';
import * as QueryString from 'query-string';
import { GolfPacketOpcode, useGolfNetworking } from '../../constants/GolfNetworking';
import { useState } from '@ecs/ecs/helpers';
import Random from '@ecs/plugins/math/Random';

export class ClientRoomState {
	constructor(public room: string = null, public availableRooms: string[] = []) {}

	joinRandomRoom() {
		this.room = Random.fromArray(this.availableRooms);
	}
}

export default class ClientRoomSystem extends System {
	network = useGolfNetworking(this, {
		connect: () => {
			setTimeout(() => {
				if (this.room) {
					this.joinRoom(this.room);
				} else {
					console.log('Sending PUBLIC_ROOMS_REQUEST');
					this.network.send({
						opcode: GolfPacketOpcode.PUBLIC_ROOMS_REQUEST
					});
				}
			}, 0);

			this.network.on(GolfPacketOpcode.PUBLIC_ROOMS_RESPONSE, data => {
				this.state.availableRooms = data.rooms;
			});
		}
	});

	state = useState(this, new ClientRoomState(this.room));

	updateFixed(dt: number) {
		super.updateFixed(dt);

		if (this.room != this.state.room) {
			this.joinRoom(this.state.room);
		}
	}

	joinRoom(roomId: string) {
		console.log('Joining room: ' + roomId);

		this.room = roomId;

		this.network.send({
			opcode: GolfPacketOpcode.JOIN_ROOM,
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
