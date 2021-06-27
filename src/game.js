import EventEmitter from 'events';
import Phaser from 'phaser';

const emitter = new EventEmitter();
const events = ['preload', 'create', 'update'];
const symbols = events.reduce((obj, event) => {
  obj[event] = Symbol(event);
  return obj;
}, {});

export const Preload = {
  on: func => emitter.on(symbols.preload, func)
};
export const Create = {
  on: func => emitter.on(symbols.create, func)
}
export const Update = {
  on: func => emitter.on(symbols.update, func)
}

const { innerWidth: width, innerHeight: height } = window;

const config = {
  type: Phaser.AUTO,
  width,
  height,
  physics: {
    default: 'arcade',
  },
  scene: events.reduce((obj, event) => {
    obj[event] = function () {
      emitter.emit(symbols[event], this);
    };
    return obj;
  }, {})
}

export const Game = new Phaser.Game(config);

