import { EventEmitter } from "stream";
import { CreatureController } from "./creature";
import { KeyEnum, keyIsDown } from "./local-keyboard";
import { Squad } from "./squad";

export const DirectionEnum = { left: 'left', right: 'right', up: 'up', down: 'down' } as const;
export type DirectionType = typeof DirectionEnum[keyof typeof DirectionEnum];
export const MoveAgentEventEnum = { dead: 'dead' } as const;
export type MoveAgentEventType = typeof MoveAgentEventEnum[keyof typeof MoveAgentEventEnum];

export interface MoveAgent {
    setNextMove(moving: boolean, dir?: DirectionType): void;
    once(key: MoveAgentEventType, listener: (...args: any[]) => void): EventEmitter;
}

export type MoveModule = (squad: Squad, index: number) => { moving: boolean, dir?: DirectionType };

export const idleMoveModule: MoveModule = () => ({ moving: false });
export const localMoveModule: MoveModule = () => {
    if (keyIsDown(KeyEnum.left)) return { dir: DirectionEnum.left, moving: true };
    if (keyIsDown(KeyEnum.right)) return { dir: DirectionEnum.right, moving: true };
    if (keyIsDown(KeyEnum.up)) return { dir: DirectionEnum.up, moving: true };
    if (keyIsDown(KeyEnum.down)) return { dir: DirectionEnum.down, moving: true };
    return { moving: false };
}
export const formationMoveModule: MoveModule = (squad, index) => {
    const dest = squad.squadronPosition(index);
    if (!dest) return { moving: false };
    const src = squad.squadrons[index].character.pos();
    if (!src) return { moving: false };
    const x = dest.x - src.x, y = dest.y - src.y;
    if ( x === 0 && y === 0 ) return { moving: false };
    let dir;
    if( Math.abs(x) > Math.abs(y) ) {
        dir = x < 0 ? DirectionEnum.left : DirectionEnum.right;
    } else {
        dir = y < 0 ? DirectionEnum.up : DirectionEnum.down;
    }
    return { moving: true, dir };
}

