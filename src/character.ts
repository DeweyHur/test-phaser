import { Preload } from './game';
import parse from 'csv-parse';
import { Scene } from 'phaser';

export const MoveKeyActionEnum = { left: 'left', right: 'right', up: 'up', down: 'down' } as const;
export type MoveKeyActionType = typeof MoveActionEnum[keyof typeof MoveActionEnum];
export const MoveActionEnum = { ...MoveKeyActionEnum, idle: 'idle' } as const;
export type MoveActionType = typeof MoveActionEnum[keyof typeof MoveActionEnum];
export const ActionEnum = { ...MoveKeyActionEnum, hit: 'hit', dead: 'dead' } as const;
export type ActionType = typeof ActionEnum[keyof typeof ActionEnum];
export const StatEnum = { hp: 'hp', hr: 'hr', at: 'at', ar: 'ar', df: 'df', dr: 'dr', aa: 'aa', ad: 'ad', md: 'md' }
export type StatType = typeof StatEnum[keyof typeof StatEnum];

export const MoveActions: { [key in MoveActionType]: Position } = {
  left: ({ x: -1, y: 0 }),
  right: ({ x: 1, y: 0 }),
  up: ({ x: 0, y: -1 }),
  down: ({ x: 0, y: 1 }),
  idle: ({ x: 0, y: 0 }),
}

const pool: { [key: number]: any } = {};

const onCreate = (scene: Scene) => {
  Object.keys(pool).forEach(no => {
    Object.keys(ActionEnum).forEach(action => {
      const frameName = `${no}_${action}`;
      const frames = scene.anims.generateFrameNames('characters', { start: 0, end: 1, prefix: `out/${no}/${action}_` });
      scene.anims.create({ key: frameName, frames, frameRate: 20, repeat: -1 });
    });
  });
}

Preload.on(async (scene: Scene) => {
  scene.load.multiatlas('characters', 'assets/characters.json', 'assets');
  scene.events.on('create', onCreate);

  const res = await fetch('/assets/characters.csv');
  const body = await res.text();
  parse(body, { columns: true }, (err, records) => {
    if (err) throw err;
    records.forEach((record: any) => {
      pool[record.no] = record;
    });
  });
});

export interface Param {
  action?: MoveActionType;
  speed?: number;
  level?: number;
}

export interface Position {
  x: number;
  y: number;
}

export class Character {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  no: number;
  action: string;
  speed: number;
  dirty: boolean;
  ai: { keep: number, next: MoveActionType };
  local: boolean;
  nextMove: MoveActionType;
  stat: { [key in StatType]: number };
  hp: number;
  ft: number;
  name: string;

  protected aiMoveRandom() {
    let { keep } = this.ai;
    if (Math.random() < keep) {
      this.ai.keep *= 0.9;
    } else {
      const index = Math.trunc(Math.random() * Object.keys(MoveActionEnum).length);
      this.ai.next = Object.values(MoveActionEnum)[index];
      this.ai.keep = 1;
    }
  }

  protected aiIdle() {
    this.ai.keep = 1;
    this.ai.next = 'idle';
  }

  protected onPreUpdate(scene: Scene) {
    this.aiIdle();
  }

  protected onUpdate(scene: Scene, time: number, delta: number) {
    const move: MoveActionType = this.local ? this.nextMove : this.ai.next;
    let { x, y } = MoveActions[move];
    x *= this.speed;
    y *= this.speed;
    this.sprite.setVelocity(x, y);
    if (move in MoveKeyActionEnum) {
      this.play(move);
    }
  }

  constructor(scene: Scene, no: number, name: string, { x, y }: Position, {
    action = MoveActionEnum.down, speed = 120, level = 1
  }: Param = {}) {
    this.sprite = scene.physics.add.sprite(x, y, name)
      .setCollideWorldBounds(true);
    this.speed = speed;
    this.no = no;
    this.play(action);
    this.action = action;
    this.dirty = false;
    this.ai = { keep: 1, next: action };
    this.local = false;
    this.nextMove = action;
    const record = pool[no];
    this.stat = {
      hp: record.hp + level * 5,
      hr: record.hr + ~~((level + 11) / 12),
      at: record.at + ~~((level + 3) / 4),
      ar: record.ar + ~~((level + 2) / 4),
      df: record.at + ~~((level + 1) / 4),
      dr: record.at + ~~(level / 4),
      aa: record.aa, 
      ad: record.ar, 
      md: record.md
    };
    this.hp = this.stat.hp;
    this.ft = 0;
    this.sprite.setData('parent', this);
    this.name = name;

    scene.events.on('preupdate', () => this.onPreUpdate.call(this, scene));
    scene.events.on('update', (...rest: [Scene, number, number]) => this.onUpdate.call(this, ...rest));
  }

  protected play(action: string) {
    if (action === this.action) return;
    this.action = action;
    this.sprite.anims.play(`${this.no}_${action}`)
  }

  setMove(...moves: MoveActionType[]) {
    if (moves.length === 0) {
      this.nextMove = MoveActionEnum.idle;
    }
    else if (moves.length === 1) {
      this.nextMove = moves[0];
    }
    else {
      const sameMoves = moves.filter(move => move === this.nextMove);
      if (sameMoves.length === 0) {
        this.nextMove = moves[0];
      }
      else {
        this.nextMove = sameMoves[0];
      }
    }
  }
};