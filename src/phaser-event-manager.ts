import { Scene } from "phaser";

export class PhaserEventManager {
    events: { type: string, wrapper: Function }[];

    constructor() {
        this.events = [];
    }

    on(caller: any, scene: Scene, type: string, listener: Function) {
        const wrapper = () => listener.call(caller, scene);
        scene.events.on(type, wrapper);
        this.events.push({ type, wrapper });
    }

    off(scene: Scene) {
        this.events.forEach(({ type, wrapper }) => scene.events.removeListener(type, wrapper));
        this.events = [];
    }
}