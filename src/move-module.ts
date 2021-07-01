import { Scene } from "phaser";
import { EventEmitter } from "stream";
import { KeyEnum, keyIsDown } from "./local-keyboard";

export const DirectionEnum = { left: 'left', right: 'right', up: 'up', down: 'down' } as const;
export type DirectionType = typeof DirectionEnum[keyof typeof DirectionEnum];
export const MoveAgentEventEnum = { dead: 'dead' } as const;
export type MoveAgentEventType = typeof MoveAgentEventEnum[keyof typeof MoveAgentEventEnum];

export interface MoveAgent {
    setNextMove(moving: boolean, dir?: DirectionType): void;
    once(key: MoveAgentEventType, listener: (...args: any[]) => void): EventEmitter;
}

export type MoveModule = (scene: Scene) => { moving: boolean, dir?: DirectionType };

export const idleMoveModule = () => ({ moving: false });
export const localMoveModule = () => {
    if (keyIsDown(KeyEnum.left)) return { dir: DirectionEnum.left, moving: true };
    if (keyIsDown(KeyEnum.right)) return { dir: DirectionEnum.right, moving: true };
    if (keyIsDown(KeyEnum.up)) return { dir: DirectionEnum.up, moving: true };
    if (keyIsDown(KeyEnum.down)) return { dir: DirectionEnum.down, moving: true };
    return { moving: false };
}

