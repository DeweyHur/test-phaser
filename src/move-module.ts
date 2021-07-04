import { Scene } from "phaser";
import { EventEmitter } from "stream";
import { Position } from "./character";
import { KeyEnum, keyIsDown } from "./local-keyboard";

export const DirectionEnum = { left: 'left', right: 'right', up: 'up', down: 'down' } as const;
export type DirectionType = typeof DirectionEnum[keyof typeof DirectionEnum];
export const MoveAgentEventEnum = { dead: 'dead' } as const;
export type MoveAgentEventType = typeof MoveAgentEventEnum[keyof typeof MoveAgentEventEnum];

export interface MoveAgent {
    setNextMove(moving: boolean, dir?: DirectionType): void;
    once(key: MoveAgentEventType, listener: (...args: any[]) => void): EventEmitter;
}

export interface MoveModule {
    next(): { moving: boolean, dir?: DirectionType };
    update?(scene: Scene): void;
}

export class IdleMoveModule implements MoveModule {
    next() { return { moving: false }; }
}

export class LocalMoveModule implements MoveModule {
    next() {
        if (keyIsDown(KeyEnum.left)) return { dir: DirectionEnum.left, moving: true };
        if (keyIsDown(KeyEnum.right)) return { dir: DirectionEnum.right, moving: true };
        if (keyIsDown(KeyEnum.up)) return { dir: DirectionEnum.up, moving: true };
        if (keyIsDown(KeyEnum.down)) return { dir: DirectionEnum.down, moving: true };
        return { moving: false };
    }
}

export class PointMoveModule implements MoveModule {
    constructor(
        protected src: Phaser.Physics.Arcade.Body,
        protected dest: Position = { x: src.x, y: src.y },
    ) { }

    next() {
        const { src, dest } = this;
        const idle = { moving: false };
        if (!src || !dest) return idle;
        const dx = dest.x - src.x, dy = dest.y - src.y;
        if (dx === 0 && dy === 0) return idle;

        const checkX = () => {
            if (dx < 0 && (!src.blocked.left || Math.abs(dx) < src.width * 2)) return { dir: DirectionEnum.left, moving: true };
            if (dx > 0 && (!src.blocked.right || Math.abs(dx) < src.width * 2)) return { dir: DirectionEnum.right, moving: true };
            return null;
        };
        const checkY = () => {
            if (dy < 0 && (!src.blocked.up || Math.abs(dy) < src.height * 2)) return { dir: DirectionEnum.up, moving: true };
            if (dy > 0 && (!src.blocked.down || Math.abs(dy) < src.height * 2)) return { dir: DirectionEnum.down, moving: true };
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            return checkX() || checkY() || idle;
        } else {
            return checkY() || checkX() || idle;
        }

    }
}
