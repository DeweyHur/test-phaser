import { Scene } from "phaser";
import { EventEmitter } from "stream";
import { AxisEnum, AxisType, Position } from "./character";
import { KeyEnum, keyIsDown } from "./local-keyboard";

export const DirectionEnum = { left: 'left', right: 'right', up: 'up', down: 'down' } as const;
export type DirectionType = typeof DirectionEnum[keyof typeof DirectionEnum];
export const MoveAgentEventEnum = { dead: 'dead' } as const;
export type MoveAgentEventType = typeof MoveAgentEventEnum[keyof typeof MoveAgentEventEnum];
const Idle = { moving: false };

export interface MoveAgent {
    exist(): boolean;
    setNextMove(moving: boolean, dir?: DirectionType): void;
    once(key: MoveAgentEventType, listener: (...args: any[]) => void): EventEmitter;
}

export interface MoveModule {
    next(): { moving: boolean, dir?: DirectionType };
    update?(scene: Scene): void;
}

export class IdleMoveModule implements MoveModule {
    next() { return Idle; }
}

export class LocalMoveModule implements MoveModule {
    next() {
        if (keyIsDown(KeyEnum.left)) return { dir: DirectionEnum.left, moving: true };
        if (keyIsDown(KeyEnum.right)) return { dir: DirectionEnum.right, moving: true };
        if (keyIsDown(KeyEnum.up)) return { dir: DirectionEnum.up, moving: true };
        if (keyIsDown(KeyEnum.down)) return { dir: DirectionEnum.down, moving: true };
        return Idle;
    }
}

export class PointMoveModule implements MoveModule {
    hex: number;
    hexAxis: AxisType;

    constructor(
        protected src: Phaser.Physics.Arcade.Body,
        protected dest: Position = { x: src.x, y: src.y },
    ) {
        this.hex = -1;
        this.hexAxis = AxisEnum.x;
    }

    protected wrapMove(axis: AxisType, dir: DirectionType) {
        this.hexAxis = axis;
        const pos = axis === AxisEnum.x ? this.src.x : this.src.y;
        this.hex = ~~(pos / 16);
        // console.log(`Set ${this.hex}/${this.hexAxis} ${this.src.x.toFixed(2)} ${this.src.y.toFixed(2)}`);
        return { dir, moving: true };
    }

    next() {
        const { src, dest } = this;
        if (!src || !dest) return Idle;
        const dx = dest.x - src.x, dy = dest.y - src.y;
        if (dx === 0 && dy === 0) return Idle;

        const vx = src.velocity.x, vy = src.velocity.y;
        if (this.hex !== -1) {
            if (this.hexAxis === AxisEnum.x && this.hex === ~~(src.x / 16)) {
                // console.log(`Keep ${this.hex}/${this.hexAxis} ${src.x.toFixed(2)} ${src.y.toFixed(2)}`);
                if (vx > 0) return this.wrapMove(this.hexAxis, DirectionEnum.right);
                if (vx < 0) return this.wrapMove(this.hexAxis, DirectionEnum.left);
            }
            else if (this.hexAxis === AxisEnum.y && this.hex === ~~(src.y / 16)) {
                // console.log(`Keep ${this.hex}/${this.hexAxis} ${src.x.toFixed(2)} ${src.y.toFixed(2)}`);
                if (vy > 0) return this.wrapMove(this.hexAxis, DirectionEnum.down);
                if (vy < 0) return this.wrapMove(this.hexAxis, DirectionEnum.up);
            }
        }

        const checkX = () => {
            if (dx < 0 && !src.blocked.left) return this.wrapMove(AxisEnum.x, DirectionEnum.left);
            if (dx > 0 && !src.blocked.right) return this.wrapMove(AxisEnum.y, DirectionEnum.right);
            return null;
        };
        const checkY = () => {
            if (dy < 0 && !src.blocked.up) return this.wrapMove(AxisEnum.x, DirectionEnum.up);
            if (dy > 0 && !src.blocked.down) return this.wrapMove(AxisEnum.y, DirectionEnum.down);
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            return checkX() || checkY() || Idle;
        } else {
            return checkY() || checkX() || Idle;
        }
    }
}
