import { useQuery, EngineContext, useBeforeMount } from '.';
import { useContext } from 'preact/hooks';
import { Entity } from '@ecs/ecs/Entity';
import { ComponentChildren, h } from 'preact';
import { all } from '@ecs/utils/QueryHelper';

export class Views {
	views: Map<string, boolean> = new Map();

	constructor() {
		window['views'] = this;
	}

	open(name: string) {
		this.views.set(name, true);
	}

	close(name: string) {
		this.views.set(name, false);
	}

	isOpen(name: string) {
		return this.views.has(name) && this.views.get(name) == true;
	}

	isClosed(name: string) {
		return !this.isOpen(name)
	}

	toggle(name: string) {
		this.views.set(name, !this.views.get(name));
	}
}

export const ViewController = props => {
	useBeforeMount(() => {
		const entity = new Entity();
		entity.add(new Views());

		const engine = useContext(EngineContext);
		engine.addEntity(entity);

		return () => {
			engine.removeEntity(entity);
		};
	});

	return <div>{props.children}</div>;
};

export const View = (props: { name: string; open?: boolean; children: ComponentChildren }) => {
	const query = useQuery(all(Views));
	const views = query.first?.get(Views);

	useBeforeMount(() => {
		if (props.open) views.open(props.name);
	});

	if (!views?.views.get(props.name)) return null;
	return <div>{props.children}</div>;
};