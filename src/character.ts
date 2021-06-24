import { Preload, Create } from './game';
import parse from 'csv-parse';
import { Scene } from 'phaser';

const frameGroups = [
  'up', 'left', 'right', 'down', 'hit', 'dead'
];

const pool: { [key: number]: any } = {
};

Preload.on(async (scene:Scene) => {
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

Create.on((scene:Scene) => {
  Object.keys(pool).forEach(no => {
    frameGroups.forEach(action => {
      const frameName = `${no}_${action}`;
      const frames = scene.anims.generateFrameNames('characters', { start: 0, end: 1, prefix: `out/${no}/${action}_` });
      scene.anims.create({ key: frameName, frames, frameRate: 20, repeat: -1 });
    });
  });
});

interface CharacterParam
{
  action?: string;
  x: number;
  y: number;
}

class Character {
  sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Scene, no: number, name: string, { action, x, y }: CharacterParam) {    
    this.sprite = scene.add.sprite(x, y, name);
    action = action || 'down';
    this.sprite.anims.play(`${no}_${action}`);
  }
};

export default Character;