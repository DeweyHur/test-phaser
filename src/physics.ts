import { validateLocaleAndSetLanguage } from "typescript";


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

export function SeparateX(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body) {
    const v1 = body1.velocity.x;
    const v2 = body2.velocity.x;
    const body1OnLeft = Math.abs(body1.right - body2.x) <= Math.abs(body2.right - body1.x);
    const body1MovingLeft = v1 < 0;
    const body1MovingRight = v1 > 0;
    const body1Stationary = v1 === 0;
    const body2OnLeft = !body1OnLeft;
    const body2MovingLeft = v2 < 0;
    const body2MovingRight = v2 > 0;
    const body2Stationary = v2 === 0;
    const overlap = body1OnLeft ? body1.right - body2.left : body2.right - body1.left;
    const halfOverlap = overlap * 0.5;

    if (body1MovingRight && body1OnLeft && body2.blocked.right) {
        body1.processX(-overlap, v2 - v1, false, true);
    }
    else if (body1MovingLeft && body2OnLeft && body2.blocked.left) {
        body1.processX(overlap, v2 - v1, true);
    }
    else if (body2MovingRight && body2OnLeft && body1.blocked.right) {
        body2.processX(-overlap, v1 - v2, false, true);
    }
    else if (body2MovingLeft && body1OnLeft && body1.blocked.left) {
        body2.processX(overlap, v1 - v2, true);
    }
    else if (body1MovingLeft && body2OnLeft) {
        if (body2Stationary) {
            body1.processX(overlap, 0, true);
            body2.processX(0, undefined, false, true);
        }
        else if (body2MovingRight) {
            body1.processX(halfOverlap, 0, true);
            body2.processX(-halfOverlap, 0, false, true);
        }
        else {
            body1.processX(halfOverlap, v2, true);
            body2.processX(-halfOverlap, undefined, false, true);
        }
    }
    else if (body2MovingLeft && body1OnLeft) {
        if (body1Stationary) {
            body1.processX(0, undefined, false, true);
            body2.processX(overlap, 0, true);
        }
        else if (body1MovingRight) {
            body1.processX(-halfOverlap, 0, false, true);
            body2.processX(halfOverlap, 0, true);
        }
        else {
            body1.processX(-halfOverlap, undefined, false, true);
            body2.processX(halfOverlap, v1, true);
        }
    }
    else if (body1MovingRight && body1OnLeft) {
        if (body2Stationary) {
            body1.processX(-overlap, 0, false, true);
            body2.processX(0, undefined, true);
        }
        else if (body2MovingLeft) {
            body1.processX(-halfOverlap, 0, false, true);
            body2.processX(halfOverlap, 0, true);
        }
        else {
            body1.processX(-halfOverlap, v2, false, true);
            body2.processX(halfOverlap, undefined, true);
        }
    }
    else if (body2MovingRight && body2OnLeft) {
        if (body1Stationary) {
            body1.processX(0, undefined, true);
            body2.processX(-overlap, 0, false, true);
        }
        else if (body1MovingLeft) {
            body1.processX(halfOverlap, 0, true);
            body2.processX(-halfOverlap, 0, false, true);
        }
        else {
            body1.processX(halfOverlap, v2, true);
            body2.processX(-halfOverlap, undefined, false, true);
        }
    }
    else {
        return false;
    }
    return true;
}

export function SeparateY(body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body) {
    const overlap = Phaser.Physics.Arcade.GetOverlapY(body1, body2, true, 4);
    const impact1 = body2.velocity.y - body1.velocity.y;
    const impact2 = body1.velocity.y - body2.velocity.y;
    const body1OnTop = Math.abs(body1.bottom - body2.y) <= Math.abs(body2.bottom - body1.y);
    const body1MovingUp = body1.deltaY() < 0;
    const body1MovingDown = body1.deltaY() > 0;
    const body2OnTop = !body1OnTop;
    const body2MovingUp = body2.deltaY() < 0;
    const body2MovingDown = body2.deltaY() > 0;

    if (body1MovingDown && body1OnTop && body2.blocked.right) {
        body1.processY(-overlap, impact1, false, true);
    }
    else if (body1MovingUp && body2OnTop && body2.blocked.left) {
        body1.processY(overlap, impact1, true);
    }
    else if (body2MovingDown && body2OnTop && body1.blocked.right) {
        body2.processY(-overlap, impact2, false, true);
    }
    else if (body2MovingUp && body1OnTop && body1.blocked.left) {
        body2.processY(overlap, impact2, true);
    }
    else {

    }
}