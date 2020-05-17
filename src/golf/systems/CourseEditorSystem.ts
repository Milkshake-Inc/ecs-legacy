import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Key from '@ecs/input/Key';
import Keyboard from '@ecs/input/Keyboard';
import Color from '@ecs/math/Color';
import MathHelper from '@ecs/math/MathHelper';
import Vector3 from '@ecs/math/Vector';
import GLTFHolder from '@ecs/plugins/3d/components/GLTFHolder';
import Raycast, { RaycastDebug, RaycastCamera } from '@ecs/plugins/3d/components/Raycaster';
import ThirdPersonCameraSystem from '@ecs/plugins/3d/systems/ThirdPersonCameraSystem';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import TrimeshShape from '@ecs/plugins/physics/components/TrimeshShape';
import Transform from '@ecs/plugins/Transform';
import { all } from '@ecs/utils/QueryHelper';
import { Body, Sphere } from 'cannon-es';
import { Group, Material, Mesh, MeshPhongMaterial, PerspectiveCamera, SphereGeometry, GridHelper, PlaneGeometry } from 'three';
import CoursePiece from '../components/CoursePice';
import PlayerBall from '../components/PlayerBall';
import { KenneyAssetsGLTF, TransfromLerp } from '../spaces/GolfSpace';
import { BallControllerSystem } from './BallControllerSystem';
import { Graphics } from 'pixi.js';
import Text from '@ecs/plugins/render/components/Text';

export class CourseEditorSystem extends System {
	protected engine: Engine;
	protected models: KenneyAssetsGLTF;

	protected elapsedTime = 0;
	protected currentPart: Entity;
	protected raycaster: Entity;

	protected index = 49;

	protected keyboard: Keyboard;
	private ball: Entity;

	protected queries = useQueries(this, {
		camera: all(PerspectiveCamera),
		pieces: all(CoursePiece)
	});

	constructor(engine: Engine, models: KenneyAssetsGLTF) {
		super();

		this.engine = engine;
		this.models = models;

		this.raycaster = new Entity();
		this.raycaster.add(RaycastDebug);
		this.raycaster.add(RaycastCamera);
		this.engine.addEntity(this.raycaster);

		this.currentPart = new Entity();
		this.currentPart.add(Transform);
		this.currentPart.add(TransfromLerp);
		this.currentPart.add(this.models.CASTLE.scene);
		// this.currentPart.add(new GridHelper(11, 11, Color.Black, Color.Black));
		this.engine.addEntity(this.currentPart);

		this.updateCurrentEditorPiece();

		this.keyboard = new Keyboard();

		document.body.addEventListener('click', event => {
			if (event.button == 0) {
				this.placeCourcePiece();
			}
			if (event.button == 2) {
				this.unplaceCoursePiece();
			}
		});

		document.body.addEventListener('mousewheel', (event: MouseWheelEvent) => {
			event.deltaY > 0 ? this.index++ : this.index--;
			this.updateCurrentEditorPiece();
		});
	}

	public onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);

		const saveButton = new Entity();
		saveButton.add(Transform, { position: new Vector3(60, 30) });
		saveButton.add(new Graphics().beginFill(0xff0050).drawRoundedRect(-50, -20, 100, 40, 5));
		saveButton.add(Text, {
			value: 'Save',
			tint: Color.White
		});
		engine.addEntity(saveButton);
	}

	createBall(position: Vector3, radius = 0.04) {
		const entity = new Entity();
		entity.add(Transform, { position });
		entity.add(
			new Mesh(
				new SphereGeometry(radius, 10, 10),
				new MeshPhongMaterial({
					color: Color.White,
					reflectivity: 0,
					specular: 0
				})
			),
			{ castShadow: true, receiveShadow: true }
		);
		entity.add(
			new CannonBody({
				mass: 1
				// linearDamping: 0.2,
				// fixedRotation: true,
			})
		);
		entity.add(new Sphere(radius));

		return entity;
	}

	protected updateCurrentEditorPiece() {
		const models = Object.values(this.models);

		this.index = MathHelper.mod(this.index, models.length);

		this.currentPart.remove(Group);
		this.currentPart.remove(GLTFHolder);

		this.currentPart.add(models[this.index].scene);
		this.currentPart.add(new GLTFHolder(models[this.index]));
	}

	protected createCourcePiece(model: Group, transform: Transform) {
		this.removeCoursePiece(transform);

		const mesh = model.clone(true);

		mesh.traverse(node => {
			if (node instanceof Mesh && node.material instanceof Material) {
				node.material = node.material.clone();
				node.material.flatShading = true;

				node.material.transparent = false;

				node.castShadow = true;
				node.receiveShadow = true;
			}
		});

		const courcePiece = new Entity();
		const modelName = Object.keys(this.models)[this.index];
		courcePiece.add(transform);
		courcePiece.add(mesh);
		courcePiece.add(new CoursePiece(modelName));
		courcePiece.add(new TrimeshShape());
		courcePiece.add(new Body());

		this.engine.addEntity(courcePiece);
	}

	protected removeCoursePiece(transform: Transform) {
		const coursePiece = this.getPieceAtTransform(transform);

		if (coursePiece) {
			this.engine.removeEntity(coursePiece);
		}
	}

	protected getPieceAtTransform(transform: Transform): Entity {
		return this.queries.pieces.firstBy(p => {
			const t = p.get(Transform);
			return transform.position.equals(t.position);
		});
	}

	protected placeCourcePiece() {
		this.createCourcePiece(this.currentPart.get(Group), Transform.From(this.currentPart.get(TransfromLerp)));
	}

	protected unplaceCoursePiece() {
		this.removeCoursePiece(Transform.From(this.currentPart.get(TransfromLerp)));
	}

	serializeMap() {
		return this.queries.pieces.entities.map(entity => {
			const transform = entity.get(Transform);
			const courcePiece = entity.get(CoursePiece);
			console.log('sset');
			return {
				modelName: courcePiece.modelName,
				transform: Transform.To(transform)
			};
		});
	}

	deserializeMap(value: { modelName: string; transform: any }[]) {
		value.forEach(piece => {
			this.createCourcePiece(this.models[piece.modelName].scene, Transform.From(piece.transform));
		});
	}

	update(deltaTime: number) {
		this.elapsedTime += deltaTime;

		const intersects = this.raycaster.get(RaycastCamera).intersects;

		const floor = intersects.find(intersect => {
			if (intersect.object instanceof Mesh) {
				// Work out it's the floor
				return intersect.object.geometry instanceof PlaneGeometry;
			}
		});

		if (floor) {
			this.currentPart.get(TransfromLerp).x = Math.round(floor.point.x);
			this.currentPart.get(TransfromLerp).z = Math.round(floor.point.z);
		}

		if (this.keyboard.isPressed(Key.V)) {
			if (!this.ball) {
				this.ball = this.createBall(new Vector3(0, 1, 0));

				this.engine.removeEntity(this.currentPart);

				this.engine.addSystem(new ThirdPersonCameraSystem());
				this.engine.addSystem(new BallControllerSystem());

				this.ball.add(PlayerBall);
				this.ball.add(ThirdPersonTarget);

				this.engine.addEntity(this.ball);
			}

			this.ball.get(CannonBody).position.set(0, 1, 0);
		}

		if (this.keyboard.isPressed(Key.ONE)) {
			const saveFile = this.serializeMap();
			console.log(saveFile);
			localStorage.setItem('map', JSON.stringify(saveFile));
		}

		if (this.keyboard.isPressed(Key.TWO)) {
			const saveFile = JSON.parse(localStorage.getItem('map'));
			console.log(saveFile);
			this.deserializeMap(saveFile);
		}

		if (this.keyboard.isPressed(Key.UP)) {
			this.currentPart.get(TransfromLerp).position.z -= 1;
		}

		if (this.keyboard.isPressed(Key.DOWN)) {
			this.currentPart.get(TransfromLerp).position.z += 1;
		}

		if (this.keyboard.isPressed(Key.LEFT)) {
			this.currentPart.get(TransfromLerp).position.x -= 1;
		}

		if (this.keyboard.isPressed(Key.RIGHT)) {
			this.currentPart.get(TransfromLerp).position.x += 1;
		}

		if (this.keyboard.isPressed(Key.R)) {
			this.currentPart.get(TransfromLerp).ry -= Math.PI / 2;
		}

		if (this.keyboard.isPressed(Key.M)) {
			this.index++;
			this.updateCurrentEditorPiece();
		}

		if (this.keyboard.isPressed(Key.N)) {
			this.index--;
			this.updateCurrentEditorPiece();
		}

		if (this.keyboard.isPressed(Key.SPACEBAR)) {
			this.placeCourcePiece();
		}

		this.keyboard.update();

		//
		if (this.currentPart) {
			const group = this.currentPart.get(Group);

			group.traverse(children => {
				if (children instanceof Mesh) {
					if (children.material instanceof Material) {
						children.material.transparent = true;
						const remappedSin = MathHelper.sin(this.elapsedTime / 200, 0.2, 0.5);
						children.material.opacity = remappedSin;
					}
				}
			});
		}
	}
}
