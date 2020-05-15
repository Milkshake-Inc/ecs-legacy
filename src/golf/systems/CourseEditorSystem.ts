import { System } from "@ecs/ecs/System";
import { Engine } from "@ecs/ecs/Engine";
import { Entity } from "@ecs/ecs/Entity";
import { KenneyAssetsGLTF, TransfromLerp } from "../spaces/GolfSpace";
import Transform from "@ecs/plugins/Transform";
import { Group, Material, Mesh, Geometry, BoxGeometry, MeshBasicMaterial } from "three";
import MathHelper from "@ecs/math/MathHelper";
import Keyboard from "@ecs/input/Keyboard";
import Key from "@ecs/input/Key";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export class CourseEditorSystem extends System {

    protected engine: Engine;
    protected models: KenneyAssetsGLTF;

    protected elapsedTime = 0;
    protected currentPart: Entity;
    protected index = 0;

    protected keyboard: Keyboard;

    constructor(engine: Engine, models: KenneyAssetsGLTF) {
        super();

        this.engine = engine;
        this.models = models;

        this.currentPart = new Entity();
        this.currentPart.add(Transform);
        this.currentPart.add(TransfromLerp);
        this.currentPart.add(this.models.CASTLE.scene);
        this.engine.addEntity(this.currentPart);

        this.keyboard = new Keyboard();
        console.log("Created")
    }

    update(deltaTime: number) {
        this.elapsedTime += deltaTime;

        // console.log(this.currentPart.get(TransfromLerp).position.z);

        if(this.keyboard.isPressed(Key.I)) {
            this.currentPart.get(TransfromLerp).position.z -= 1;

        }

        if(this.keyboard.isPressed(Key.K)) {
            this.currentPart.get(TransfromLerp).position.z += 1;
        }

        if(this.keyboard.isPressed(Key.J)) {
            this.currentPart.get(TransfromLerp).position.x -= 1;
        }

        if(this.keyboard.isPressed(Key.L)) {
            this.currentPart.get(TransfromLerp).position.x += 1;
        }

        if(this.keyboard.isPressed(Key.U)) {
            this.currentPart.get(TransfromLerp).ry += Math.PI / 2;
        }

        if(this.keyboard.isPressed(Key.O)) {
            this.currentPart.get(TransfromLerp).ry -= Math.PI / 2;
        }

        const updateModel = () => {

            const models = Object.values(this.models);

            if(this.index < 0) {
                this.index = models.length - 1;
            }

            if(this.index > models.length) {
                this.index = 0;
            }

            this.currentPart.remove(Group);
            this.currentPart.add(models[this.index].scene);
        }

        if(this.keyboard.isPressed(Key.M)) {
            this.index++
            updateModel();
        }

        if(this.keyboard.isPressed(Key.N)) {
            this.index--;
            updateModel();
        }

        if(this.keyboard.isPressed(Key.SPACEBAR)) {
            const newPart = new Entity();
            newPart.add(this.currentPart.get(Transform).clone())
            const mesh = this.currentPart.get(Group).clone(true);
            mesh.traverse((node) => {
                if (node instanceof Mesh && node.material instanceof Material) {
                  node.material = node.material.clone();
                  node.material.transparent = false;
                }
              });
            newPart.add(mesh);
            this.engine.addEntity(newPart);

            console.log("added");
        }

        this.keyboard.update();

        if(this.currentPart) {
            const group = this.currentPart.get(Group);

            group.traverse((children) => {
                if(children instanceof Mesh) {
                    if(children.material instanceof Material) {
                        children.material.transparent = true;
                        const remappedSin = MathHelper.map(-1, 1, 0.2, 0.5, Math.sin(this.elapsedTime / 200));
                        children.material.opacity = remappedSin;
                    }

                }
            })
        }
    }
}