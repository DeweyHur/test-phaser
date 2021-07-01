import React from 'react';
import { Preload } from './game';
import { Character } from './character';
import { defaultFormation, LocalSquad, Squad, SquadronController } from './squad';
import { Scene } from 'phaser';
import { CreatureController } from './creature';
import { DirectionEnum } from './move-module';

const onCreate = (scene: Scene) => {
    const map: Phaser.Tilemaps.Tilemap = scene.make.tilemap({ key: 'tilemap' });
    const tileset: Phaser.Tilemaps.Tileset = map.addTilesetImage('istanbul', 'base_tiles');
    const warpzones: Phaser.GameObjects.GameObject[] = map.createFromObjects('warpzones', { scene });
    const warpzonesLayer: Phaser.Tilemaps.ObjectLayer = map.getObjectLayer('warpzones');
    warpzones.forEach((warpzone, index) => {
        scene.physics.add.existing(warpzone);
        const warpId = warpzone.getData('warp');
        if (warpId) {
            const index = warpzonesLayer.objects.findIndex(x => x.id === warpId);
            if (index !== -1) {
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

    const Cardic = new LocalSquad(scene, 'Cardic', { x: 550, y: 350 });
    [
        [0, 'Aless'],
        [1, 'Errane'],
        [2, 'Alfred'],
        ...Array.from({ length: 3 }).map((_, index) => ([85, `CGeneral${index + 1}`])),
        ...Array.from({ length: 6 }).map((_, index) => ([84, `CSoldier${index + 1}`])),
    ].forEach(([no, name]) => {
        const character = new Character(scene, +no, `${name}`);
        const creatureController = new CreatureController(scene, character, +no, 20);
        Cardic.add(scene, character, creatureController, DirectionEnum.down);
    });
    Cardic.follow(scene);

    const Varcia = new Squad(scene, 'Varcia', { x: 550, y: 650 }, defaultFormation, DirectionEnum.up );
    [
        [29, 'John'],
        [30, 'Xenel'],
        [49, 'VWarrior'],
        ...Array.from({ length: 3 }).map((_, index) => ([50, `VKnight${index + 1}`])),
        ...Array.from({ length: 6 }).map((_, index) => ([58, `VSoldier${index + 1}`])),
    ].forEach(([no, name]) => {
        const character = new Character(scene, +no, `${name}`);
        const creatureController = new CreatureController(scene, character, +no, 20);
        Varcia.add(scene, character, creatureController, DirectionEnum.up);
    });

    scene.physics.add.collider(Cardic.group, Varcia.group, (lhs, rhs) => {
        const { creatureController: lhsController }: SquadronController = lhs.getData('squadron');
        const { creatureController: rhsController }: SquadronController = rhs.getData('squadron');
        lhsController.hitBy(scene, rhsController);
        rhsController.hitBy(scene, lhsController);
    });
    scene.physics.add.collider(Cardic.group, Cardic.group, (lhs, rhs) => {
    });

    scene.physics.add.collider(Cardic.group, tilelayer);
    scene.physics.add.collider(Varcia.group, tilelayer);

    const leader = Cardic.squadrons[0].character;
    if (leader.sprite)
        scene.physics.add.overlap(leader.sprite, warpzones, (lhs, rhs) => {
            const warp = lhs.getData('warp');
            if (warp) {
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