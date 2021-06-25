import { Create, Update } from './game';
import { Character, Position } from './character';
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
    left: ({ x, y }: Position) => ({ x: x - 1, y }),
    right: ({ x, y }: Position) => ({ x: x + 1, y }),
    up: ({ x, y }: Position) => ({ x, y: y - 1 }),
    down: ({ x, y }: Position) => ({ x, y: y + 1 }),
}

Update.on((scene: Scene) => {
    if (!controllee) return;

    const dir = Object.entries(keyAction)
        .filter(([key]) => keys[key].isDown)
        .reduce((pos, [_, func]) => func(pos), { x: 0, y: 0 });
    controllee.setDirection(dir);
});
