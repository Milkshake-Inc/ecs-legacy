import { h } from 'preact';

export const Hud = props => {
	const style = {
		position: 'absolute',
		color: 'white',
		fontFamily: 'Quicksand',
		fontWeight: 700,
		width: '1280px',
		height: '720px'
	};

	return <div style={style}>{props.children}</div>;
};
