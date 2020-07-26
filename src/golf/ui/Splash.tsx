import { Box, Row } from 'jsxstyle/preact';
import { h } from 'preact';
import { Button, Colors, FullscreenNoise, H2, Input } from './Shared';
import { useState, useSingletonQuery } from '@ecs/ecs/helpers';
import { useECS } from '@ecs/plugins/ui/react';
import { GolfPacketOpcode, useGolfNetworking } from '../constants/GolfNetworking';
import { ClientRoomState } from '../systems/client/ClientRoomSystem';

export const Splash = () => {
	const { state, network, roomState } = useECS(engine => ({
		roomState: useSingletonQuery(engine, ClientRoomState),
		state: useState(engine, {
			name: ''
		}),
		network: useGolfNetworking(engine, {
			connect: () => {
				setTimeout(() => {
					network.on(GolfPacketOpcode.CREATE_ROOM_RESPONSE, (packet, entity) => {
						roomState().room = packet.roomId;
					});
				});
			}
		})
	}));

	const handleJoin = (event: Event) => {
		event.preventDefault();

		if (state.name.length > 0) {
			network.send({
				opcode: GolfPacketOpcode.UPDATE_PROFILE,
				name: state.name
			});
		}

		roomState().joinRandomRoom();
	};

	const handleCreate = (event: Event) => {
		event.preventDefault();

		if (state.name.length > 0) {
			network.send({
				opcode: GolfPacketOpcode.UPDATE_PROFILE,
				name: state.name
			});
		}

		network.send({
			opcode: GolfPacketOpcode.CREATE_ROOM_REQUEST,
			public: false
		});
	};

	const handleChange = (event: Event) => {
		event.preventDefault();
		state.name = event.target['value'];
	};

	return (
		<form onSubmit={handleJoin}>
			<FullscreenNoise>
				<Box paddingBottom={20}>
					<img src='assets/golf/logo.png' width='400' />
				</Box>

				<Row background='white' borderRadius={5} margin={10}>
					<Input fontSize='2.5vw' textAlign='center' placeholder='Enter your name' onChange={handleChange} autofocus />
					<Button
						background={Colors.PURPLE}
						borderTopLeftRadius={0}
						borderBottomLeftRadius={0}
						padding={10}
						props={{ onClick: handleJoin }}
					>
						JOIN
					</Button>
				</Row>

				<Button margin={10} props={{ onClick: handleCreate }}>
					CREATE
				</Button>
			</FullscreenNoise>
		</form>
	);
};
