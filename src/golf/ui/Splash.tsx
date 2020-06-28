import { Box, Row } from "jsxstyle/preact";
import { h } from 'preact';
import { Button, Colors, FullscreenNoise, H2 } from './Shared';

export const Splash = () => {

	return (
		<FullscreenNoise>
            <Box  paddingBottom={20} >
                <img src="assets/golf/logo.png" width="400" />
            </Box>

            <Row background="white" borderRadius={5} margin={10}  >
                <H2 color={Colors.LIGHT} padding={10} fontWeight={400} paddingLeft={20} paddingRight={20} >ROOM CODE</H2>
                <H2 background={Colors.PURPLE} padding={10} borderTopRightRadius={5} borderBottomRightRadius={5} >JOIN</H2>
            </Row>

            <Button margin={10} >CREATE</Button>

		</FullscreenNoise>
	);
};
