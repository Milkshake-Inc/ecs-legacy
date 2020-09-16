import { Entity } from '@ecs/core/Entity';
import { ThreeEngine } from '@ecs/plugins/render/3d/ThreeEngine';
import ClientGolfSpace from './spaces/ClientGolfSpace';
import GolfRenderSystem from './systems/client/GolfRenderSystem';
import { render, h } from 'preact';
import App from './ui/App';
import WebFont from 'webfontloader';

const engine = new ThreeEngine(new GolfRenderSystem());

const ui = document.createElement('div');
document.body.prepend(ui);
render(h(App, { engine }), ui);

WebFont.load({
	google: {
		families: ['Quicksand:700']
	}
});

const spaces = new Entity();
spaces.add(new ClientGolfSpace(engine, true));
engine.addEntity(spaces);

console.log('🎉 Client');
