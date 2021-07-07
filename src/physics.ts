export const DirectionEnum = { left: 'left', right: 'right', up: 'up', down: 'down' } as const;
export type DirectionType = typeof DirectionEnum[keyof typeof DirectionEnum];
export const AxisEnum = { x: 'x', y: 'y' };
export type AxisType = typeof AxisEnum[keyof typeof AxisEnum];
export const DirBegin = (axis: AxisType) => (axis === AxisEnum.x) ? DirectionEnum.left : DirectionEnum.up;
export const DirEnd = (axis: AxisType) => (axis === AxisEnum.x) ? DirectionEnum.right : DirectionEnum.down;
export const ConvertToAxis = (dir: DirectionType) => (dir === DirectionEnum.down || dir === DirectionEnum.up) ? AxisEnum.y : AxisEnum.x;
export const ConvertToDir = (axis: AxisType, value: number) => {
    if (axis === AxisEnum.x) {
        if (value > 0) return DirectionEnum.right;
        if (value < 0) return DirectionEnum.left;
    }
    else if (axis === AxisEnum.y) {
        if (value > 0) return DirectionEnum.down;
        if (value < 0) return DirectionEnum.up;
    }
    return null;
}


export function Separate(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body) {
    const overlapX = Math.min(body1.right - body2.left, body2.right - body1.left);
    const overlapY = Math.min(body1.bottom - body2.top, body2.bottom - body1.top);
    if (overlapX < overlapY) SeparateAxis('x', [body1, body2], overlapX);
    else SeparateAxis('y', [body1, body2], overlapY);
}

export function Bound(min: number, value: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

function SeparateAxis(axis: 'x' | 'y', bodies: Phaser.Physics.Arcade.Body[], overlap: number) {
    if (overlap === 0) return true;
    const isX = axis === 'x';
    const begin = isX ? 'left' : 'top';
    const end = isX ? 'right' : 'bottom';
    const objs = bodies.map((body, index) => {
        const other = bodies[(index + 1) % 2];
        const v = body.velocity[axis] || 0;
        return {
            body,
            v,
            onBefore: Math.abs(body[end] - other[axis]) <= Math.abs(other[end] - body[axis]),
            movingLeft: v < 0,
            movingRight: v > 0,
            stationary: v === 0,
            endBlocked: isX ? body.blocked.right : body.blocked.left,
            beginBlocked: isX ? body.blocked.down : body.blocked.up,
            process: isX ? body.processX.bind(body) : body.processY.bind(body),
        };
    });
    const before = objs[0].onBefore ? objs[0] : objs[1];
    const after = objs[0].onBefore ? objs[1] : objs[0];
    const halfOverlap = overlap * 0.5;

    if (after.endBlocked && before.beginBlocked) {
        console.warn(`Both end blocked. Do nothing. Overlap ${overlap} Axis ${axis}`);
        before.process(0, 0, before.beginBlocked, true);
        after.process(0, 0, true, after.endBlocked);
        return false;
    }
    if (after.endBlocked) {
        before.process(-overlap, 0, before.beginBlocked, true);
        after.process(0, 0, true, after.endBlocked);
    }
    else if (before.beginBlocked) {
        before.process(0, 0, before.beginBlocked, true);
        after.process(overlap, 0, true, after.endBlocked);
    }
    else if (before.v > 0 && after.v < 0) {
        before.process(-halfOverlap, 0, before.beginBlocked, true);
        after.process(halfOverlap, 0, true, after.endBlocked);
    }
    else if (before.v > 0) {
        before.process(-overlap, 0, before.beginBlocked, true);
        after.process(0, after.v, true, after.endBlocked);
    }
    else if (after.v < 0) {
        before.process(0, before.v, before.beginBlocked, true);
        after.process(overlap, 0, true, after.endBlocked);
    }
    else {
        before.process(-halfOverlap, 0, before.beginBlocked, true);
        after.process(halfOverlap, 0, true, after.endBlocked);
    }
    const newOverlap = before.body[end] - after.body[begin];
    if (newOverlap > 0) {
        console.warn(`Overlap ${overlap} -> ${newOverlap}`);
    }
    return true;
}