import { Game, Event, Preload, Create } from './game';

const frameGroups = {
  'Move': { end: 2, frameRate: 10, repeat: -1 },
  'Attack': { end: 4, frameRate: 10, repeat: -1 }, 
};

class CharacterSprite {
  constructor(name) {
    Object.entries(frameGroups).forEach(([key, { end, frameRate, repeat }]) => {
      const frames = Game.anims.generateFrameNames(name, { start: 1, end, prefix: `${key}/`, suffix: '.png' });
      Game.anims.create({ key, frames, frameRate, repeat: -1 });
    });
  }
};

const characters = [
  'dwarf'
];

class CharacterSpritePool {
  constructor() {
    Event.on('preload')
  }

  preload() {
    ['dwarf'].forEach(name => {
      Game.load.multiatlas(name, `assets/${name}.json`, 'assets');
      this[name] = new CharacterSprite(name);
    });

  }
};

export default CharacterSpritePool;