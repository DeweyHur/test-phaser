import { Scene } from "phaser";
import { EventEmitter } from "stream";
import { Position } from "./character";
import { KeyEnum, keyIsDown } from "./local-keyboard";
import { AxisEnum, AxisType, ConvertToAxis, ConvertToDir, DirBegin, DirectionEnum, DirectionType, DirEnd } from "./physics";

export const MoveAgentEventEnum = { dead: 'dead' } as const;
export type MoveAgentEventType = typeof MoveAgentEventEnum[keyof typeof MoveAgentEventEnum];
export const Idle = { moving: false, dir: undefined };

export interface MoveAgent {
    exist(): boolean;
    setNextMove(moving: boolean, dir?: DirectionType): void;
    once(key: MoveAgentEventType, listener: (...args: any[]) => void): EventEmitter;
}

export interface MoveModule {
    next(scene: Scene): { moving: boolean, dir?: DirectionType };
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
    detour?: { check: DirectionType, dir: DirectionType }
    checkRect: Phaser.GameObjects.Rectangle;
    dirRect: Phaser.GameObjects.Rectangle;

    constructor(
        scene: Scene,
        protected src: Phaser.Physics.Arcade.Body,
        protected dest?: Position,
    ) {
        this.hex = -1;
        this.hexAxis = AxisEnum.x;
        this.checkRect = scene.add.rectangle(0, 0, 0, 0, 0xff0000);
        this.dirRect = scene.add.rectangle(0, 0, 0, 0, 0x0000ff);
    }

    protected wrapMove(axis: AxisType, dir: DirectionType | null) {
        if (!dir) return Idle;
        this.hexAxis = axis;
        const pos = axis === AxisEnum.x ? this.src.x : this.src.y;
        this.hex = ~~(pos / 16);
        // console.log(`Set ${this.hex}/${this.hexAxis} ${this.src.x.toFixed(2)} ${this.src.y.toFixed(2)}`);
        return { dir, moving: true };
    }

    protected getDirRect(dir: DirectionType): number[] {
        const src = this.src;
        switch (dir) {
            case DirectionEnum.left: return [src.x - 16, src.y, 16, src.height];
            case DirectionEnum.right: return [src.x + src.width, src.y, 16, src.height];
            case DirectionEnum.up: return [src.x, src.y - 16, src.width, 16];
            case DirectionEnum.down: return [src.x, src.y + src.height, src.width, 16];
        }
    }

    protected drawDirRect(rect: Phaser.GameObjects.Rectangle, dir: DirectionType, color?: number) {
        const [x, y, width, height] = this.getDirRect(dir);
        rect.x = x;
        rect.y = y;
        rect.width = width;
        rect.height = height;
        rect.visible = true;
        if (color) rect.fillColor = color;
    }

    next(scene: Scene) {
        const { src, dest } = this;
        if (!src || !dest) return Idle;
        const d: { [key in AxisType]: number } = { x: dest.x - src.x, y: dest.y - src.y };
        if (d.x === 0 && d.y === 0) return Idle;
        const v: { [key in AxisType]: number } = { x: src.velocity.x, y: src.velocity.y };
        const hex: { [key in AxisType]: number } = { x: ~~(src.x / 16), y: ~~(src.y / 16) };
        const blocked: { [key in DirectionType]: boolean } = {
            left: src.blocked.left,
            right: src.blocked.right,
            up: src.blocked.up,
            down: src.blocked.down,
        };
        if (this.hex !== -1) {
            const axis = this.hexAxis;
            if (this.hex === hex[axis]) {
                // console.log(`Keep ${this.hex}/${this.hexAxis} ${src.x.toFixed(2)} ${src.y.toFixed(2)}`);
                const move = this.wrapMove(axis, ConvertToDir(axis, v[axis]));
                if (move !== Idle) return move;
            }
        }

        if (this.detour) {
            const { check, dir } = this.detour;
            const overlap = (checkDir: DirectionType) => {
                const rect = this.getDirRect(checkDir);
                const objs = scene.physics.overlapRect(rect[0], rect[1], rect[2], rect[3]) as Phaser.Physics.Arcade.Body[];
                return objs.filter(x => x !== this.src).length > 0;
            }

            const checkOverlap = overlap(check);
            const dirOverlap = overlap(dir);
            // this.drawDirRect(this.checkRect, check, checkOverlap ? 0xff0000 : 0x777700);
            // this.drawDirRect(this.dirRect, dir, dirOverlap ? 0x0000ff : 0x007777);

            if (checkOverlap && !dirOverlap) {
                return this.wrapMove(ConvertToAxis(dir), dir);
            } else {
                delete this.detour;
            }
        }
        else {
            this.checkRect.visible = false;
            this.dirRect.visible = false;
        }


        const checkDetour = (axis: AxisType) => {
            const begin = DirBegin(axis), end = DirEnd(axis);
            const ortho = axis === AxisEnum.x ? AxisEnum.y : AxisEnum.x;
            if (d[axis] < 0) {
                if (!blocked[begin]) return this.wrapMove(axis, begin);
                if (!blocked[end]) return this.wrapMove(axis, end);
            } else if (d[axis] > 0) {
                if (!blocked[end]) return this.wrapMove(axis, end);
                if (!blocked[begin]) return this.wrapMove(axis, begin);
            } else if (d[ortho] < 0) {
                if (!blocked[begin]) return this.wrapMove(axis, begin);
                if (!blocked[end]) return this.wrapMove(axis, end);
            } else {
                if (!blocked[end]) return this.wrapMove(axis, end);
                if (!blocked[begin]) return this.wrapMove(axis, begin);
            }
            return Idle;
        }

        const calcMove = (axis: AxisType) => {
            const dir = ConvertToDir(axis, d[axis]);
            const ortho = axis === AxisEnum.x ? AxisEnum.y : AxisEnum.x;
            if (!dir) return null;
            if (blocked[dir]) {
                const detour = checkDetour(ortho);
                if (!detour.dir) return null;
                this.detour = { check: dir, dir: detour.dir };
                return this.wrapMove(ortho, detour.dir);
            }
            else {
                return this.wrapMove(axis, dir);
            }
        }

        if (Math.abs(d.x) > Math.abs(d.y)) {
            return calcMove(AxisEnum.x) || calcMove(AxisEnum.y) || Idle;
        } else {
            return calcMove(AxisEnum.y) || calcMove(AxisEnum.x) || Idle;
        }
    }
}
