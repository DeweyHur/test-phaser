import { Scene } from "phaser";
import { KeyEnum, keyIsDown } from "./local-keyboard";
import { DirectionEnum, DirectionType } from "./move-controller";

export type MoveModule = (scene: Scene) => { moving: boolean, dir?: DirectionType };

export const idleMoveModule = () => ({ moving: false });
export const localMoveModule = () => {
    if (keyIsDown(KeyEnum.left)) return { dir: DirectionEnum.left, moving: true };
    if (keyIsDown(KeyEnum.right)) return { dir: DirectionEnum.right, moving: true };
    if (keyIsDown(KeyEnum.up)) return { dir: DirectionEnum.up, moving: true };
    if (keyIsDown(KeyEnum.down)) return { dir: DirectionEnum.down, moving: true };
    return { moving: false };
}

