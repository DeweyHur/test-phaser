import React from 'react';
import { Preload } from './game';
import { Character } from './character';
import { bindSquad } from './local-keyboard';
import { Squad } from './squad';
import { Scene } from 'phaser';

const onCreate = (scene: Scene) => {
    const map: Phaser.Tilemaps.Tilemap = scene.make.tilemap({ key: 'tilemap' });
    const tileset: Phaser.Tilemaps.Tileset = map.addTilesetImage('istanbul', 'base_tiles');
    const warpzones: Phaser.GameObjects.GameObject[] = map.createFromObjects('warpzones', { scene });
    const warpzonesLayer: Phaser.Tilemaps.ObjectLayer = map.getObjectLayer('warpzones');
    warpzones.forEach((warpzone, index) => {
        scene.physics.add.existing(warpzone);
        const warpId = warpzone.getData('warp');
        if ( warpId ) {
            const index = warpzonesLayer.objects.findIndex(x => x.id === warpId);
            if( index !== -1 ) {
                warpzone.setData('warp', warpzones[index]);
            }
            else {
                console.error(`Warp ${warpId} indicates a wrong node.`);
                warpzone.setData('warp', null);
            }
        }
    });
    const tilelayer = map.createLayer('maptile', tileset);

    scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    tilelayer.setCollisionByProperty({ collides: true });

    // const music = scene.sound.add('bgm', { loop: true });
    // music.play();

    const mySquad = new Squad(scene, 'mine');
    mySquad.add(
        new Character(scene, 0, '0', { x: 300, y: 300 }),
        new Character(scene, 1, '1', { x: 350, y: 300 }),
    );
    bindSquad(scene, mySquad);

    console.log(mySquad)

    const yourSquad = new Squad(scene, 'yours');
    yourSquad.add(
        new Character(scene, 2, '2', { x: 400, y: 300 }),
        new Character(scene, 3, '3', { x: 450, y: 300 }),
        new Character(scene, 4, '4', { x: 500, y: 300 }),
        new Character(scene, 56, '56', { x: 800, y: 800 }),
        new Character(scene, 57, '57', { x: 850, y: 800 }),
        new Character(scene, 58, '58', { x: 900, y: 800 }),
        new Character(scene, 59, '59', { x: 950, y: 800 }),
        new Character(scene, 60, '60', { x: 1000, y: 800 }),
    );

    scene.physics.add.collider(mySquad.group, yourSquad.group, (lhs, rhs) => {
        scene.physics.world.separate(lhs.body as Phaser.Physics.Arcade.Body, rhs.body as Phaser.Physics.Arcade.Body, () => { }, null, true);
        const lhsChar: Character = lhs.getData('character');
        const rhsChar: Character = rhs.getData('character');
        lhsChar.hitBy(scene, rhsChar);
        rhsChar.hitBy(scene, lhsChar);
    });

    scene.physics.add.collider(mySquad.group, tilelayer, (lhs, rhs) => {
    });

    scene.physics.add.collider(yourSquad.group, tilelayer, (lhs, rhs) => {
        // console.log('wallyoursquad');
    });

    scene.physics.add.overlap(mySquad.group, warpzones, (lhs, rhs) => {
        const warp = lhs.getData('warp');
        if( warp ) {
            rhs.body.reset(warp.x, warp.y);
            const rhsChar: Character = rhs.getData('character');
            console.log(`${rhsChar.name} jumps to ${warp.x}, ${warp.y}`);
        }
    });
}


const Stage = () => {
    React.useEffect(() => {
        Preload.on((scene: Scene) => {
            scene.events.on('create', () => onCreate.call(this, scene));
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