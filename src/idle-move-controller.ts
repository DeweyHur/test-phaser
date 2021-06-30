import { Scene } from 'phaser';
import { DirectionType, MoveAgent, MoveController } from './move-controller';

export class IdleMoveController extends MoveController {
    calcNextMove(scene: Phaser.Scene): { dir?: DirectionType; moving: boolean; } {
        return { moving: false };
    }
}