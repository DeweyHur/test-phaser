import { Preload, Create } from './game';
import parse from 'csv-parse';
import { Scene } from 'phaser';

const frameGroups = [
  'up', 'left', 'right', 'down', 'hit', 'dead'
];

const pool: { [key: number]: any } = {
};

Preload.on(async (scene: Scene) => {
  scene.load.multiatlas('characters', 'assets/characters.json', 'assets');

  const res = await fetch('/assets/characters.csv');
  const body = await res.text();
  parse(body, { columns: true }, (err, records) => {
    if (err) throw err;
    records.forEach((record: any) => {
      pool[record.no] = record;
    });
  });
});

Create.on((scene: Scene) => {
  Object.keys(pool).forEach(no => {
    frameGroups.forEach(action => {
      const frameName = `${no}_${action}`;
      const frames = scene.anims.generateFrameNames('characters', { start: 0, end: 1, prefix: `out/${no}/${action}_` });
      scene.anims.create({ key: frameName, frames, frameRate: 20, repeat: -1 });
    });
  });
});

export interface Param {
  action?: string;
  speed?: number;
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

  constructor(scene: Scene, no: number, name: string, { x, y }: Position, {
    action = 'down', speed = 4
  }: Param = {}) {
    this.sprite = scene.physics.add.sprite(x, y, name)
      .setCollideWorldBounds(true);
    this.speed = speed;
    this.no = no;
    this.play(action);
    this.action = action;
  }

  play(action: string) {
    if( action === this.action ) return;
    this.action = action;
    this.sprite.anims.play(`${this.no}_${action}`)
  }

  setDirection({ x, y }: Position) {
    this.sprite.setX( this.sprite.x + x * this.speed );
    this.sprite.y += y * this.speed;
    let newAction;
    if (x < 0) newAction = 'left';
    else if (x > 0) newAction = 'right';
    else if (y < 0) newAction = 'up';
    else if (y > 0) newAction = 'down';

    if (newAction) {
      this.play(newAction);
    }
  }
};