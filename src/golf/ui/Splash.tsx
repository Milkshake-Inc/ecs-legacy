import { Box, Row } from 'jsxstyle/preact';
import { h } from 'preact';
import { Button, Colors, FullscreenNoise, H2, Input } from './Shared';
import { useState } from '@ecs/ecs/helpers';
import { useECS } from '@ecs/plugins/ui/react';
import { useNetworking } from '@ecs/plugins/net/helpers/useNetworking';

export const Splash = () => {
	const { state, networking } = useECS(engine => ({
		state: useState(engine, {
			name: ''
		}),
		networking: useNetworking(engine)
	}));

	const handleSubmit = (event: Event) => {
		event.preventDefault();
		// networking.send();
	};

	const handleChange = (event: Event) => {
		event.preventDefault();
		state.name = event.target['value'];
	};

	return (
		<form onSubmit={handleSubmit}>
			<FullscreenNoise>
				<Box paddingBottom={20}>
					<img src='assets/golf/logo.png' width='400' />
				</Box>

				<Row background='white' borderRadius={5} margin={10}>
					<Input fontSize='2.5vw' textAlign='center' placeholder='Enter your name' onChange={handleChange} />
					<Button background={Colors.PURPLE} borderTopLeftRadius={0} borderBottomLeftRadius={0} padding={10}>
						JOIN
					</Button>
				</Row>

				<Button margin={10}>CREATE</Button>
			</FullscreenNoise>
		</form>
	);
};
