import { Application, Container, DisplayObject as PixiDisplayObject } from 'pixi.js';
import DisplayObject from './DisplayObject';

export default class RenderState {
	public container: Container;
	public application: Application;
	public displayObjects: Map<DisplayObject, PixiDisplayObject> = new Map();
	public constructor() {}
}
