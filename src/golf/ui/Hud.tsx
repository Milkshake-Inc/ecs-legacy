import { h } from 'preact';

export const Hud = props => {
	const style = {
		position: 'absolute',
		paddingLeft: '15px',
		color: 'white',
		fontFamily: 'Quicksand'
	};

	return <div style={style}>{props.children}</div>;
};
