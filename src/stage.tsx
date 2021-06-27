import React from 'react';
import { Preload } from './game';
import { Character } from './character';
import { bindSquad } from './local-keyboard';
import { Squad } from './squad';
import { Scene } from 'phaser';

const onCreate = (scene: Scene) => {
    const map: Phaser.Tilemaps.Tilemap = scene.make.tilemap({ key: 'tilemap' });
    const tileset: Phaser.Tilemaps.Tileset = map.addTilesetImage('istanbul', 'base_tiles');
    const entrance = map.createLayer('entrance', tileset);
    const tilelayer = map.createLayer('maptile', tileset);

    scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    tilelayer.setCollisionByProperty({ collides: true });



    console.log(map.tilesets[0])
    // const music = scene.sound.add('bgm', { loop: true });
    // music.play();

    const mySquad = new Squad(scene, 'mine');
    mySquad.add(
        new Character(scene, 0, '0', { x: 300, y: 300 }),
        new Character(scene, 1, '1', { x: 350, y: 300 }),
        new Character(scene, 2, '2', { x: 400, y: 300 }),
        new Character(scene, 3, '3', { x: 450, y: 300 }),
        new Character(scene, 4, '4', { x: 500, y: 300 }),
    );
    bindSquad(scene, mySquad);

    const yourSquad = new Squad(scene, 'yours');
    yourSquad.add(
        new Character(scene, 56, '56', { x: 800, y: 800 }),
        new Character(scene, 57, '57', { x: 850, y: 800 }),
        new Character(scene, 58, '58', { x: 900, y: 800 }),
        new Character(scene, 59, '59', { x: 950, y: 800 }),
        new Character(scene, 60, '60', { x: 1000, y: 800 }),
    );

    scene.physics.add.collider(mySquad.group, yourSquad.group, (lhs, rhs) => {
    });

    
    scene.physics.add.collider(mySquad.group, tilelayer, (lhs, rhs) => {
    });

    scene.physics.add.collider(yourSquad.group, tilelayer, (lhs, rhs) => {
        console.log('wallyoursquad');
    });
}


const Stage = () => {
    React.useEffect(() => {
        Preload.on((scene: Scene) => {
            scene.events.on('create', onCreate);  
            scene.load.image('base_tiles', 'assets/image/istanbul.png');
            scene.load.tilemapTiledJSON('tilemap', 'assets/istanbul.json');
            scene.load.audio('bgm', ['assets/audio/BGM14.mp3']);            
        });
    }, []);

    return (
        <></>
    );
};

export default Stage;