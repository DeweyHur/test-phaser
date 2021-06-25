import { Create, Update } from './game';
import { Position } from './character';
import { Scene } from 'phaser';
import { Squad } from './squad';

let controllee: Squad;

const followAvatar = (scene: Scene) => {
    if (!controllee) return;
    const avatar = controllee.avatar();
    if (avatar) {
        console.log(`Shift to ${controllee.cursor || 'none'}`);
        // scene.cameras.main.startFollow(avatar.sprite, true, 0.05, 0.05);
    }
}

export const bindSquad = (scene: Scene, squad: Squad) => {
    controllee = squad;
    followAvatar(scene);
}

const keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};

const keyCodes = {
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    shift: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    unshift: Phaser.Input.Keyboard.KeyCodes.LEFT,
}

Create.on((scene: Scene) => {
    Object.entries(keyCodes).forEach(([key, code]) => {
        keys[key] = scene.input.keyboard.addKey(code);
    });
    scene.input.keyboard.addCapture(Object.keys(keyCodes));
});

const moveActions = {
    left: ({ x, y }: Position) => ({ x: x - 1, y }),
    right: ({ x, y }: Position) => ({ x: x + 1, y }),
    up: ({ x, y }: Position) => ({ x, y: y - 1 }),
    down: ({ x, y }: Position) => ({ x, y: y + 1 }),
}

const keyActions = {
    shift: (scene: Scene) => {
        controllee.shift();
        followAvatar(scene);
    },
    unshift: (scene: Scene) => {
        controllee.unshift();
        followAvatar(scene);
    },
}

Update.on((scene: Scene) => {
    if (!controllee) return;

    const avatar = controllee.avatar();
    if (!avatar) return;

    const dir = Object.entries(moveActions)
        .filter(([key]) => keys[key].isDown)
        .reduce((pos, [_, func]) => func(pos), { x: 0, y: 0 });
    avatar.setDirection(dir);

    Object.entries(keyActions)
        .filter(([key]) => Phaser.Input.Keyboard.JustDown(keys[key]))
        .forEach(([_, func]) => func(scene));
});
