import { Preload } from './game';
import { Scene } from 'phaser';

export const KeyEnum = { left: 'left', right: 'right', up: 'up', down: 'down', shift: 'shift', unshift: 'unshift' } as const;
export type KeyType = typeof KeyEnum[keyof typeof KeyEnum];

const keyObjs: { [key: string]: Phaser.Input.Keyboard.Key } = {};
const keyCodes: { [key in KeyType]: number } = {
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    shift: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    unshift: Phaser.Input.Keyboard.KeyCodes.LEFT,
};

export const KeyEventEnum = { down: 'down', up: 'up' } as const;
export type KeyEventType = typeof KeyEventEnum[keyof typeof KeyEventEnum];

export function keyOn(type: KeyEventType, key: KeyType, listener: (...args: any[]) => void) {
    keyObjs[key].on(type, listener);
}

export function keyOff(type: KeyEventType, key: KeyType, listener: (...args: any[]) => void) {
    keyObjs[key].removeListener(type, listener);
}

export function keyIsDown(key: KeyType): boolean {
    return keyObjs[key].isDown;
}

export function keyIsUp(key: KeyType): boolean {
    return keyObjs[key].isUp;
}

const onCreate = (scene: Scene) => {
    Object.entries(keyCodes).forEach(([key, code]) => {
        keyObjs[key] = scene.input.keyboard.addKey(code);
    });
    scene.input.keyboard.addCapture(Object.keys(keyCodes));
};

Preload.on((scene: Scene) => {
    scene.events.on('create', () => onCreate.call(this, scene));
});