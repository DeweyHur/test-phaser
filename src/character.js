import { Preload, Create } from './game';
import parse from 'csv-parse';

const frameGroups = [
  'up', 'left', 'right', 'down', 'hit', 'dead'
];
const characters = {
};

Preload.on(async (scene) => {
  scene.load.multiatlas('characters', 'assets/characters.json', 'assets');

  const res = await fetch('/assets/characters.csv');
  const body = await res.text();
  parse(body, { columns: true }, (err, records) => {
    if (err) throw err;
    records.forEach(record => {
      characters[record.no] = record;
    });
  });
});

Create.on((scene) => {
  Object.keys(characters).forEach(no => {
    frameGroups.forEach(action => {
      const frameName = `${no}_${action}`;
      const frames = scene.anims.generateFrameNames('characters', { start: 0, end: 1, prefix: `out/${no}/${action}_` });
      scene.anims.create({ key: frameName, frames, frameRate: 20, repeat: -1 });
    });
  });
});

class Character {
  constructor(scene, no, name, { action, x, y }) {
    this.sprite = scene.add.sprite(x, y, name);
    action = action || 'down';
    this.sprite.anims.play(`${no}_${action}`);
  }
};

export default Character;