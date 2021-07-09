import { Preload } from './game';
import { Scene } from 'phaser';
import { Squad, Squadron } from './squad';
import { characterPool, Creature } from './creature';
import { EventEmitter } from 'events';
import { MoveAgent, MoveAgentEventEnum, MoveAgentEventType } from './move-module';
import { AxisType, DirectionEnum, DirectionType } from './physics';

export const ActionEnum = { ...DirectionEnum, hit: 'hit', dead: 'dead', rest: 'rest' } as const;
export type ActionType = typeof ActionEnum[keyof typeof ActionEnum];

export const MoveActions: { [key in DirectionType]: { x: number, y: number } } = {
  left: ({ x: -1, y: 0 }),
  right: ({ x: 1, y: 0 }),
  up: ({ x: 0, y: -1 }),
  down: ({ x: 0, y: 1 }),
}
export type Position = { [key in AxisType]: number };

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

let factory: Phaser.Physics.Arcade.Factory;
let emptySprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
Preload.on((scene: Scene) => {
  scene.events.on('create', () => onCreate.call(this, scene));
  factory = new Phaser.Physics.Arcade.Factory(scene.physics.world);
  emptySprite = factory.sprite(0, 0, "");
});


export class Character implements MoveAgent, Creature, Squadron {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  squad?: Squad;
  dirty: boolean;
  emitter: EventEmitter;
  dir: DirectionType;
  action?: ActionType;
  position?: Position;

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
    this.sprite = emptySprite;
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // Implement Squadron
  spawn(scene: Scene, { x, y }: Position, dir: DirectionType): Phaser.Types.Physics.Arcade.GameObjectWithDynamicBody {
    if (this.sprite !== emptySprite) {
      this.sprite.setPosition(x, y);
    } else {
      this.sprite = scene.physics.add.sprite(x, y, ActionEnum.down);
      this.play(dir);
      this.sprite.body.pushable = false;
      
      this.sprite.setCollideWorldBounds();
    }
    this.position = { x, y };
    return this.sprite;
  }

  ////////////////////////////////////////////////////////////////////////////////////////
  // Implement MoveAgent
  exist() {
    return this.sprite !== emptySprite;
  }

  once(key: MoveAgentEventType, listener: (...args: any[]) => void): EventEmitter {
    return this.emitter.once(key, listener);
  }

  setNextMove(moving: boolean, dir: DirectionType = this.dir) {
    if (dir !== this.dir && Object.keys(DirectionEnum).some(x => x === this.action)) {
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

  ////////////////////////////////////////////////////////////////////////////////////////
  // Implement Creature
  pos(): Phaser.Math.Vector2 {
    return this.sprite.body.position;
  }

  protected play(action: ActionType): boolean {
    if (this.sprite === emptySprite) return false;
    if (this.action === action) return false;
    const frameName = `${this.no}_${action}`;
    this.sprite.anims.play(frameName);
    this.action = action;
    return true;
  }

  onHit(): void {
    if (this.play('hit')) {
      this.sprite.once('animationcomplete', () => {
        this.play('down');
      });
    }
  }

  onDead(): void {
    if (this.play('dead')) {
      this.sprite.once('animationcomplete', () => {
        this.emitter.emit(MoveAgentEventEnum.dead);
        if (this.sprite !== emptySprite) {
          this.sprite.destroy();
          this.sprite = emptySprite;
        }
      });
    }
  }

  actionable(): boolean {
    return this.action ? this.action !== ActionEnum.hit && this.action !== ActionEnum.dead : false;
  }
};