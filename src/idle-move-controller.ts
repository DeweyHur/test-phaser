import { Scene } from 'phaser';
import { DirectionType, MoveAgent, MoveController } from './move-controller';

export const IdleMoveModule = (scene: Scene, agent: MoveAgent) => { moving: false };

export class IdleMoveController extends MoveController {
    calcNextMove(scene: Phaser.Scene): { dir?: DirectionType; moving: boolean; } {
        return { moving: false };
    }
}