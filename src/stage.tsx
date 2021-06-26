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
            const characters = Array.from({ length: 18 }).map((_, index) => {
                const x = 300 + (index % 6) * 64;
                const y = 400 + Math.trunc(index / 6) * 64;
                return new Character(scene, index, `${index}`, { x, y });
            });
            mySquad.add(...characters);

            bindSquad(scene, mySquad);
        });
    }, []);

    return (
        <></>
    );
};

export default Stage;