import { KeyEnum, keyIsDown } from './local-keyboard';
import { DirectionEnum, DirectionType, MoveController } from './move-controller';

export class LocalMoveController extends MoveController {
    calcNextMove(scene: Phaser.Scene): { dir?: DirectionType; moving: boolean; } {
        if (keyIsDown(KeyEnum.left)) return { dir: DirectionEnum.left, moving: true };
        if (keyIsDown(KeyEnum.right)) return { dir: DirectionEnum.right, moving: true };
        if (keyIsDown(KeyEnum.up)) return { dir: DirectionEnum.up, moving: true };
        if (keyIsDown(KeyEnum.down)) return { dir: DirectionEnum.down, moving: true };
        return { moving: false };
    }
}