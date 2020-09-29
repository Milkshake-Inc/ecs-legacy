import Color from "@ecs/plugins/math/Color";

export class Light {
    public size = 200;
    public feather = 50;
    public color = Color.SkyBlue;
    public intensity = 1.0;
    public drawsToMask = true;
    public drawsToColor = true;
}