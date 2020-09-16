import { h } from 'preact';
import { FlexCenter, Colors, Flex, H1, H2, H3, H4, Button, FlexCenterRow } from './Shared';
import { useQueries } from '@ecs/core/helpers';
import { useECS } from '@ecs/plugins/ui/react';
import { all } from '@ecs/core/Query';
import ThirdPersonTarget from '@ecs/plugins/render/3d/systems/ThirdPersonTarget';
import GolfPlayer from '../components/GolfPlayer';
import Color from '@ecs/plugins/math/Color';
import { GolfCameraState } from '../systems/client/GolfCameraSystem';

export const Spectator = () => {
	const { queries } = useECS(engine => ({
		queries: useQueries(engine, {
			currentTarget: all(ThirdPersonTarget, GolfPlayer),
			golfCameraState: all(GolfCameraState)
		})
	}));

	const camState = queries.golfCameraState.first;
	const currentTarget = queries.currentTarget.first;
	if (!currentTarget || !camState) return;

	const { name, color } = currentTarget.get(GolfPlayer);

	const previous = () => {
		camState.get(GolfCameraState).target--;
	};

	const next = () => {
		camState.get(GolfCameraState).target++;
	};

	return (
		<FlexCenter width='100%' height='100%'>
			<FlexCenter width='100%' height='10%' background={Colors.DARK}>
				<H2>SPECTATOR VIEW</H2>
				<H4>You will join in the next hole</H4>
			</FlexCenter>
			<Flex width='100%' height='80%'>
				<H1 color={Colors.RED} fontSize='4vw' padding='1vw'>
					● LIVE
				</H1>
			</Flex>
			<FlexCenterRow width='100%' height='10%' background={Colors.DARK}>
				<Button width='14vw' height='80%' padding='0' background={Colors.PURPLE} props={{ onClick: previous }}>
					Previous
				</Button>
				<FlexCenter padding='2vw'>
					<H3>You are watching:</H3>
					<H4 color={Color.ToHex(color)}>{name}</H4>
				</FlexCenter>
				<Button width='14vw' height='80%' padding='0' background={Colors.PURPLE} props={{ onClick: next }}>
					Next
				</Button>
			</FlexCenterRow>
		</FlexCenter>
	);
};
