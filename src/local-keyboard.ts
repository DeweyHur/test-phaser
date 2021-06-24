import { Create, Update } from './game';
import Character from './character';
import { Scene } from 'phaser';

let controllee: Character;

export const bindCharacter = (character: Character) => {
    controllee = character;
}

const keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};

const keyCodes = {
    left: Phaser.Input.Keyboard.KeyCodes.LEFT,
    right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    up: Phaser.Input.Keyboard.KeyCodes.UP,
    down: Phaser.Input.Keyboard.KeyCodes.DOWN,
}

Create.on((scene: Scene) => {
    Object.entries(keyCodes).forEach(([key, code]) => {
        keys[key] = scene.input.keyboard.addKey(code);
    });
    scene.input.keyboard.addCapture(Object.keys(keyCodes));
});

const keyAction = {
    left: () => controllee.sprite.x -= 1,
    right: () => controllee.sprite.x += 1,
    up: () => controllee.sprite.y -= 1,
    down: () => controllee.sprite.y += 1,
}

Update.on((scene: Scene) => {
    if( !controllee ) return;
    Object.entries(keyAction)
        .filter(([key, func]) => keys[key].isDown)
        .forEach(([key, func]) => func())
});
