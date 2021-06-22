import EventEmitter from 'events';
import Phaser from 'phaser.js';

const emitter = new EventEmitter();
const events = ['preload', 'create', 'update'];
const symbols = events.reduce((obj, event) => {
  obj[event] = Symbol(event);
  return obj;
} ,{});

 

export const Preload = {
  on: func => emitter.on(symbols.preload, func)
}
export const Create = {
  on: func => emitter.on(symbols.create, func)
}
export const Update = {
  on: func => emitter.on(symbols.update, func)
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
      default: 'arcade',
      arcade: { gravity: { y: 200 } }
  },
  scene: events.reduce((obj, event) => {
    obj[event] = () => Event.emit(symbols[event]);
    return obj;
  }, {})
}

export const Game = new Phaser.Game(config);

