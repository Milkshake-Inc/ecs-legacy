import { h } from 'preact';
import { FullscreenNoise, Modal } from './Shared';

export const FullscreenModal = (props) => {
	return <FullscreenNoise>
		<Modal width="80%" height="60%" {...props} >
			{props.children}
		</Modal>
    </FullscreenNoise>;
};
