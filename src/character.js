import { Preload, Create } from './game';

const frameGroups = {
  'Move': { end: 2, frameRate: 10, repeat: -1 },
  'Attack': { end: 4, frameRate: 10, repeat: -1 },
};

const characters = [
  'dwarf'
];

Preload.on((scene) => {
  characters.forEach(name => {
    scene.load.multiatlas(name, `assets/${name}.json`, 'assets');
  })
});

Create.on((scene) => {
  characters.forEach(name => {
    Object.entries(frameGroups).forEach(([state, { end, frameRate, repeat }]) => {
      const frames = scene.anims.generateFrameNames(name, { start: 1, end, prefix: `${state}/`, suffix: '.png' });
      scene.anims.create({ key: `${name}_${state}`, frames, frameRate, repeat });
    });
  });
});

class Character {
  constructor(scene, name, { state, x, y }) {
    this.sprite = scene.add.sprite(x, y, name);
    this.sprite.anims.play(`${name}_${state}`);
  }
};

export default Character;