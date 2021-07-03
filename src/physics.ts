
export function Separate(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body) {
    SeparateAxis('x', [body1, body2]);
    SeparateAxis('y', [body1, body2]);
}

function SeparateAxis(axis: 'x' | 'y', bodies: Phaser.Physics.Arcade.Body[]) {
    const isX = axis === 'x';
    const begin = isX ? 'left' : 'top';
    const end = isX ? 'right' : 'bottom';
    const objs = bodies.map((body, index) => {
        const other = bodies[(index + 1) % 2];
        const v = body.velocity[axis];
        return {
            body,
            v,
            onLeft: Math.abs(body.right - other.x) <= Math.abs(other.right - body.x),
            movingLeft: v < 0,
            movingRight: v > 0,
            stationary: v === 0,
            endBlocked: isX ? body.blocked.right : body.blocked.left,
            beginBlocked: isX ? body.blocked.down : body.blocked.up,
            process: isX ? body.processX.bind(body) : body.processY.bind(body),
        };
    });
    const before = objs[0].onLeft ? objs[0] : objs[1];
    const after = objs[0].onLeft ? objs[1] : objs[0];
    const overlap = before.body[end] - after.body[begin];
    const halfOverlap = overlap * 0.5;

    if (before.v > 0) {
        if (after.endBlocked) {
            before.process(-overlap, after.v - before.v, false, true);
        }
        else if (after.v === 0) {
            before.process(-overlap, 0, false, true);
            after.process(0, undefined, true);
        }
        else if (after.v < 0) {
            before.process(-halfOverlap, 0, false, true);
            after.process(halfOverlap, 0, true);
        }
        else {
            before.process(-halfOverlap, after.v, false, true);
            after.process(halfOverlap, undefined, true);
        }
    }
    else if (after.v < 0) {
        if (before.beginBlocked) {
            after.process(overlap, before.v - after.v, true);
        }
        else if (before.v === 0) {
            after.process(overlap, 0, true);
            before.process(0, undefined, false, true);
        }
        else if (before.v > 0) {
            after.process(halfOverlap, 0, true);
            before.process(-halfOverlap, 0, false, true);
        }
        else {
            after.process(halfOverlap, before.v, true);
            before.process(halfOverlap, undefined, false, true);
        }
    }
    else {
        return false;
    }
    return true;
}