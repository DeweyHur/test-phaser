import React from 'react';
import { Preload, Create } from './game';
import { Character } from './character';
import { bindSquad } from './local-keyboard';
import { Squad } from './squad';
import { Scene } from 'phaser';

const Stage = () => {
    React.useEffect(() => {
        Preload.on((scene: Scene) => {
            scene.load.image('base_tiles', 'assets/image/istanbul.png');
            scene.load.tilemapTiledJSON('tilemap', 'assets/istanbul.json');
            scene.load.audio('bgm', ['assets/audio/BGM14.mp3']);
        });
        Create.on((scene: Scene) => {
            const map = scene.make.tilemap({ key: 'tilemap' });
            const tileset = map.addTilesetImage('istanbul', 'base_tiles');
            map.createLayer('entrance', tileset);
            map.createLayer('maptile', tileset);

            const music = scene.sound.add('bgm', { loop: true });
            music.play();

            const mySquad = new Squad('mine');
            mySquad.add(
                new Character(scene, 0, '0', { x: 300, y: 400 }),
                new Character(scene, 1, '1', { x: 350, y: 400 }),
                new Character(scene, 2, '2', { x: 400, y: 400 }),
                new Character(scene, 3, '3', { x: 450, y: 400 }),
                new Character(scene, 4, '4', { x: 500, y: 400 }),
            );
            bindSquad(scene, mySquad);
        });
    }, []);

    return (
        <></>
    );
};

export default Stage;