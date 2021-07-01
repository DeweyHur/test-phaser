import { Preload } from './game';
import { Scene } from 'phaser';
import { Squad, Squadron } from './squad';
import { characterPool, Creature } from './creature';
import { EventEmitter } from 'events';
import { DirectionEnum, DirectionType, MoveAgent, MoveAgentEventEnum, MoveAgentEventType } from './move-module';

export const ActionEnum = { ...DirectionEnum, hit: 'hit', dead: 'dead', rest: 'rest' } as const;
export type ActionType = typeof ActionEnum[keyof typeof ActionEnum];

export const MoveActions: { [key in DirectionType]: { x: number, y: number } } = {
  left: ({ x: -1, y: 0 }),
  right: ({ x: 1, y: 0 }),
  up: ({ x: 0, y: -1 }),
  down: ({ x: 0, y: 1 }),
}
export type Position = { x: number, y: number };

const frameInfo: { [key in ActionType]: { frameRate: number, repeat: number, frame?: string } } = {
  left: { frameRate: 20, repeat: -1 },
  right: { frameRate: 20, repeat: -1 },
  up: { frameRate: 20, repeat: -1 },
  down: { frameRate: 20, repeat: -1 },
  rest: { frameRate: 20, repeat: -1, frame: 'dead' },
  hit: { frameRate: 4, repeat: 0 },
  dead: { frameRate: 1, repeat: 0 },
}

const getFrameKey = (no: number, action: ActionType) => `${no}_${action}`;

const onCreate = (scene: Scene) => {
  Object.keys(characterPool).forEach(no => {
    Object.keys(ActionEnum).forEach((actionString: string) => {
      const action: ActionType = actionString as ActionType;
      const { frameRate, repeat, frame = action } = frameInfo[action];
      const key = getFrameKey(+no, action);
      const frames = scene.anims.generateFrameNames('characters', { start: 0, end: 1, prefix: `out/${no}/${frame}_` });
      scene.anims.create({ key, frames, frameRate, repeat });
    });
  });
}

Preload.on((scene: Scene) => {
  scene.events.on('create', () => onCreate.call(this, scene));
});

export class Character implements MoveAgent, Creature, Squadron {
  sprite?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  squad?: Squad;
  dirty: boolean;
  emitter: EventEmitter;
  dir: DirectionType;
  action?: ActionType;

  constructor(
    scene: Scene,
    protected no: number,
    public name: string,
    protected speed: number = 120,
    protected level: number = 1
  ) {
    this.dirty = false;
    this.emitter = new EventEmitter();
    this.dir = DirectionEnum.down;
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // Implement Squadron
  spawn(scene: Scene, { x, y }: Position): Phaser.GameObjects.Sprite {
    if (this.sprite) {
      this.sprite.setPosition(x, y);
    } else {
      this.sprite = scene.physics.add.sprite(x, y, ActionEnum.down);
      this.play(ActionEnum.down);
      this.sprite.body.pushable = false;
    }
    return this.sprite;
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // Implement MoveAgent
  alive(): boolean {
    return !!this.sprite;
  }

  once(key: MoveAgentEventType, listener: (...args: any[]) => void): EventEmitter {
    return this.emitter.once(key, listener);
  }

  setNextMove(moving: boolean, dir: DirectionType = this.dir) {
    if (this.sprite) {
      if (dir !== this.dir && Object.keys(DirectionEnum).some(x => x === this.action) ) {
        this.play(dir);
        this.dir = dir;
      }
      if (moving) {
        const x = MoveActions[dir].x * this.speed;
        const y = MoveActions[dir].y * this.speed;
        this.sprite.setVelocity(x, y);
      } else {
        this.sprite.setVelocity(0, 0);
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // Implement Creature
  pos(): Phaser.Math.Vector2 | null {
    if (!this.sprite) return null;
    return this.sprite.body.position;
  }

  protected play(action: ActionType): boolean {
    if (!this.sprite) return false;
    if (this.action === action) return false;
    const frameName = `${this.no}_${action}`;
    this.sprite.anims.play(frameName);
    this.action = action;
    return true;
  }

  onHit(): void {
    if (!this.sprite) return;
    if (this.play('hit')) {
      this.sprite.once('animationcomplete', () => {
        this.play('down');
      });
    }
  }

  onDead(): void {
    if (!this.sprite) return;
    if (this.play('dead')) {
      this.sprite.once('animationcomplete', () => {
        this.emitter.emit(MoveAgentEventEnum.dead);
        if (this.sprite) {
          this.sprite.destroy();
          delete this.sprite;
        }
      });
    }
  }

  actionable(): boolean {
    return this.action ? this.action !== ActionEnum.hit && this.action !== ActionEnum.dead : false;
  }
};