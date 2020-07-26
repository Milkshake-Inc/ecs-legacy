import { useECS } from '@ecs/plugins/ui/react';
import { all } from '@ecs/ecs/Query';
import { Box, Row } from 'jsxstyle/preact';
import { h } from 'preact';
import GolfPlayer from '../components/GolfPlayer';
import { GolfPacketOpcode, useGolfNetworking } from '../constants/GolfNetworking';
import { FullscreenModal } from './FullscreenModal';
import { Button, Flex, H1, H2, Input, Colors } from './Shared';
import Session from '@ecs/plugins/net/components/Session';
import { useQueries, useState } from '@ecs/ecs/helpers';
import { writeText as copyTextToClipboard } from 'clipboard-polyfill';

export const Lobby = () => {
	const { state, queries, networking } = useECS(engine => ({
		state: useState(engine, {
			copyText: 'invite your friends'
		}),
		queries: useQueries(engine, {
			sessions: all(GolfPlayer)
		}),
		networking: useGolfNetworking(engine)
	}));

	const players = queries.sessions.map(entity => {
		return entity.get(GolfPlayer);
	});

	const self = queries.sessions.find(entity => entity.has(Session));
	const isHost = self ? Boolean(self.get(GolfPlayer).host) : false;

	const createPlayer = (player, index) => {
		const name = player.host ? `${player.name} (host)` : player.name;

		return (
			<H2 color={`#${player.color.toString(16)}`} background={!(index % 2) && '#00000036'} margin={0} padding='0.6vw'>
				{name}
			</H2>
		);
	};

	const handleStartGame = () => {
		if (!isHost) return;
		console.info('Start game');
		networking.send(
			{
				opcode: GolfPacketOpcode.START_GAME
			},
			true
		);
	};

	const handleCopyLink = () => {
		copyTextToClipboard(location.href);
		state.copyText = 'Link copied!';
		setTimeout(() => {
			state.copyText = 'Invite your friends!';
		}, 2000);
	};

	const handleCopyInputMouseEnter = () => {
		state.copyText = location.href;
	};

	const handleCopyInputMouseLeave = () => {
		state.copyText = 'Invite your friends!';
	};

	return (
		<FullscreenModal>
			<Row width='100%' height='100%'>
				<Flex width='65%' height='100%'>
					<H1 margin='15px 0px 15px 15px'>Lobby</H1>
					{players.map(createPlayer)}
				</Flex>
				<Flex width='56%'>
					<Box height='77%' background={'url(assets/golf/map_preview.png)'} backgroundSize='cover' />
					<Button props={{ onClick: handleStartGame }} borderRadius={0} height='23%' disabled={!isHost}>
						<H2 margin={0}>{isHost ? 'Start Game' : 'Waiting For Host'}</H2>
					</Button>
				</Flex>
			</Row>
			<Row width='100%' marginTop={50}>
				<Input
					width='100%'
					fontSize='1.5vw'
					padding={10}
					textAlign='center'
					value={state.copyText}
					onMouseEnter={handleCopyInputMouseEnter}
					onMouseLeave={handleCopyInputMouseLeave}
					readonly
				/>
				<Button
					background={Colors.PURPLE}
					borderTopLeftRadius={0}
					borderBottomLeftRadius={0}
					fontSize='1.5vw'
					padding={10}
					props={{ onClick: handleCopyLink }}
				>
					COPY
				</Button>
			</Row>
		</FullscreenModal>
	);
};
