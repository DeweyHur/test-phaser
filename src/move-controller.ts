import { Scene } from "phaser";
import { EventEmitter } from "stream";

export const DirectionEnum = { left: 'left', right: 'right', up: 'up', down: 'down' } as const;
export type DirectionType = typeof DirectionEnum[keyof typeof DirectionEnum];
export const MoveAgentEventEnum = { dead: 'dead' } as const;
export type MoveAgentEventType = typeof MoveAgentEventEnum[keyof typeof MoveAgentEventEnum];

export interface MoveAgent {
    alive(): boolean;
    setNextMove(moving: boolean, dir?: DirectionType): void;
    once(key: MoveAgentEventType, listener: (...args: any[]) => void): EventEmitter;
}

export abstract class MoveController {
    constructor(scene: Scene, protected agent: MoveAgent) {
        scene.events.on('preupdate', (scene: Scene) => {
            if (!agent.alive()) return;
            const { dir, moving } = this.calcNextMove(scene);
            agent.setNextMove(moving, dir);
        });
    }

    abstract calcNextMove(scene: Scene): { moving: boolean, dir?: DirectionType };
}