import { System } from '@ecs/ecs/System';
import Position from '@ecs/plugins/Position';
import TileMap from '@ecs/plugins/tilemap/components/TileMap';
import { TileMapAsset } from '@ecs/plugins/tilemap/components/TileMapAsset';
import { all } from '@ecs/utils/QueryHelper';
import { BaseTexture, ParticleContainer as PixiParticleContainer, Rectangle, Sprite as PixiSprite, Texture, Sprite } from 'pixi.js';
import { usePixiCouple } from './PixiCouple';

const buildTileMap = (tileSize: number, xTiles: number, yTiles: number): Rectangle[] => {
	const tiles: Rectangle[] = [];

	for (let y = 0; y < yTiles; y++) {
		for (let x = 0; x < xTiles; x++) {
			tiles.push(new Rectangle(x * tileSize, y * tileSize, tileSize, tileSize));
		}
	}

	return tiles;
};

class TileMapRenderData {
	public tiles: Rectangle[];
}

class TileMapContainer extends PixiParticleContainer {
	public tiles: Map<string, Sprite> = new Map();

	constructor(imageUrl: string, width: number, height: number, tileSize: number) {
		super(undefined, {
			uvs: true
		});

		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				const sprite = new PixiSprite(new Texture(BaseTexture.from(imageUrl)));
				sprite.position.set(x * tileSize, y * tileSize);
				this.tiles.set(`${x}_${y}`, sprite);

				this.addChild(sprite);
			}
		}
	}
}

export const useTileMapCouple = (system: System) =>
	usePixiCouple<TileMapContainer>(system, all(Position, TileMap, TileMapAsset), {
		onCreate: entity => {
			const tileMap = entity.get(TileMap);
			const tileMapAsset = entity.get(TileMapAsset);

			const renderData = new TileMapRenderData();
			renderData.tiles = buildTileMap(tileMapAsset.tileSize, tileMapAsset.xTiles, tileMapAsset.yTiles);
			entity.add(renderData);
			const container = new TileMapContainer(tileMapAsset.imageUrl, tileMap.width, tileMap.height, tileMapAsset.tileSize);

			return container;
		},
		onUpdate: (entity, displayObject) => {
			const tileMap = entity.get(TileMap);
			const renderData = entity.get(TileMapRenderData);

			for (let x = 0; x < tileMap.width; x++) {
				for (let y = 0; y < tileMap.height; y++) {
					const tile = tileMap.data[y][x];
					const frame = renderData.tiles[tile];
					const sprite = displayObject.tiles.get(`${x}_${y}`);

					if (sprite.texture.frame != frame) {
						sprite.texture.frame = frame;
					}
				}
			}
		}
	});
