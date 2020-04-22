import Space from '@ecs/plugins/space/Space';
import * as dat from 'dat.gui';
import { Entity } from '@ecs/ecs/Entity';

export class ECSGraph extends Space {
	private gui: dat.GUI;
	private seen: Set<any> = new Set();
	private entityFolders: Map<Entity, dat.GUI> = new Map();
	private maxDepth = 15;
	private search = '';
	private blackList = ['RenderState'];

	setup() {
		this.gui = new dat.GUI();
		this.gui.useLocalStorage = true;

		const searchController = this.gui.add(this, 'search');
		searchController.onFinishChange(this.processSearch.bind(this));
		this.gui.add(this, 'closeAll');

		this.addFolder(this.gui, 'entities');
		for (const entity of this.worldEngine.entities) {
			this.addEntityToGraph(entity);
		}
	}

	closeAll() {
		this.forEachFolder(f => {
			if (!f.closed) f.close();
		}, this.entitiesFolder);
	}

	processSearch(search) {
		if (search == '') return;

		search = search.toLowerCase();
		this.closeAll();

		// open folders and parents that match
		this.forEachFolder(folder => {
			const open = () => {
				let parent = folder;
				while (parent) {
					parent.open();
					parent = parent.parent;
				}
			};

			if (folder.name?.toLowerCase().includes(search)) {
				open();
				return;
			}

			for (const controller of folder.__controllers) {
				if (typeof controller.property == 'string' && controller.property.toLowerCase().includes(search)) {
					open();
					return;
				}
			}
		});
	}

	update(dt: number) {
		if (!this.gui) return;
		this.gui.updateDisplay();
	}

	forEachFolder(handler: (folder: dat.GUI) => void, folder: dat.GUI = this.gui) {
		if (!this.gui) return;
		handler(folder);

		for (const folderName of Object.keys(folder.__folders)) {
			this.forEachFolder(handler, folder.__folders[folderName]);
		}
	}

	get entitiesFolder(): dat.GUI {
		return this.gui?.__folders['entities'];
	}

	addEntityToGraph(entity: Entity) {
		if (!this.gui || !entity) return;
		const eFolder = this.addFolder(this.entitiesFolder, entity.toString());
		if (!eFolder) return;

		this.entityFolders.set(entity, eFolder);
		for (const component of entity.getAll()) {
			const cFolder = this.addFolder(eFolder, component.constructor.name, entity.id);
			if (!cFolder) return;
			const properties = Object.getOwnPropertyNames(component);

			for (const prop of properties) {
				this.renderChildren(cFolder, component, prop);
			}
		}
	}

	removeEntityFromGraph(entity: Entity) {
		if (!this.gui) return;
		const folder = this.entityFolders.get(entity);
		if (folder) {
			this.entitiesFolder.removeFolder(folder);
		}
	}

	renderChildren(parentFolder: dat.GUI, parent: object, fieldName: string, depth = 0) {
		const field = parent[fieldName];
		if (field == null || field == undefined) return;
		if (depth >= this.maxDepth) return;

		if (typeof field != 'object') {
			try {
				if (fieldName == 'tint' || field == 'color') {
					parentFolder.addColor(parent, fieldName);
				} else {
					parentFolder.add(parent, fieldName);
				}
			} catch (e) {
				console.warn(`unsupported ${this.getObjectName(field)} for property ${this.getObjectName(parent)}:${fieldName}`);
			}
			return;
		}

		const fieldChildren = this.getChildren(field);
		const folder = this.addFolder(parentFolder, this.getObjectName(field), fieldName);
		if (!folder) return;
		for (const child of fieldChildren) {
			const hash = `${parentFolder.name}>${folder.name}>${child}`;
			if (this.seen.has(hash)) {
				continue;
			}
			this.seen.add(hash);
			this.renderChildren(folder, field, child, depth++);
		}
	}

	addFolder(parent: dat.GUI, name: string, id: string | number = '') {
		if (this.blackList.includes(name)) return;
		return parent.addFolder(name + id);
	}

	getChildren(field) {
		if (Array.isArray(field)) {
			return field;
		}

		if (field instanceof Map || field instanceof Set) {
			return Array.from(field.keys());
		}

		return Object.getOwnPropertyNames(field);
	}

	getObjectName(obj) {
		return obj.constructor ? obj.constructor.name : typeof obj;
	}

	clear() {
		super.clear();
		this.gui.destroy();
		this.gui = null;
		this.seen = new Set();
	}
}
