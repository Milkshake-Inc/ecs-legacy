import 'pixi-tiledmap';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { makeQuery, all } from '@ecs/utils/QueryHelper';
import { TileMapAsset } from '../components/TileMapAsset';
import { useState, useQueries } from '@ecs/ecs/helpers';
import RenderState from '@ecs/plugins/render/components/RenderState';
import { EntitySnapshot, Entity } from '@ecs/ecs/Entity';
import { Container, BaseTexture, Rectangle } from 'pixi.js';
import TiledMap from 'index';
import TileMap from '../components/TileMap';
import { Query } from '@ecs/ecs/Query';

class TileMapRendererState {
	public tilemaps: Map<Entity, Container> = new Map();
}

// useCoupleSysten (system, query, ...)

export default class TileMapRendererSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		renderState: all(RenderState)
	});

	protected state = useState(this, new TileMapRendererState());

	constructor() {
		super(makeQuery(all(TileMap, TileMapAsset)));
	}

	protected entityAdded = (entitySnapshot: EntitySnapshot) => {
		const entity = entitySnapshot.entity;

		const tileMap = entity.get(TileMap);
		const tileMapAsset = entity.get(TileMapAsset);

		const container = new Container();
		this.state.tilemaps.set(entity, container);

		const baseTexture = BaseTexture.from(tileMapAsset.imageUrl);
	};

	protected get renderState() {
		return this.queries.renderState.first.get(RenderState);
	}

	private buildTilemap(tileSize: number, xTiles: number, yTiles: number): Rectangle[] {
		const tiles: Rectangle[] = [];

		for (let y = 0; y < yTiles; y++) {
			for (let x = 0; x < xTiles; x++) {
				tiles.push(new Rectangle(x * tileSize, y * tileSize, tileSize, tileSize));
			}
		}

		console.log(`Generated Tiles: ${tiles.length}`);

		return tiles;
	}
}
