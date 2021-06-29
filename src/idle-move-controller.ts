import { DirectionEnum, DirectionType, MoveController } from './move-controller';

class IdleMoveController implements MoveController {
    calcNextMove(scene: Phaser.Scene): { dir?: DirectionType; moving: boolean; } {
        return { moving: false };
    }
}