import { EngineContext, useBeforeMount, useECS } from '.';
import { useContext } from 'preact/hooks';
import { Entity } from '@ecs/core/Entity';
import { ComponentChildren, h, Fragment } from 'preact';
import { all } from '@ecs/core/Query';
import { useQueries } from '@ecs/core/helpers';

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
		return !this.isOpen(name);
	}

	toggle(name: string) {
		this.views.set(name, !this.views.get(name));
	}

	set(name: string, open: boolean) {
		if (open && this.isClosed(name)) {
			this.open(name);
		}

		if (!open && this.isOpen(name)) {
			this.close(name);
		}
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
	const { queries } = useECS(engine => ({
		queries: useQueries(engine, {
			views: all(Views)
		})
	}));

	const views = queries.views.first?.get(Views);

	useBeforeMount(() => {
		if (props.open) views.open(props.name);
	});

	if (!views?.views.get(props.name)) return null;
	return <Fragment>{props.children}</Fragment>;
};
