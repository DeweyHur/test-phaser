import React from 'react';
import { Preload } from './game';
import { Character } from './character';
import { defaultFormation, LocalSquad, Squad } from './squad';
import { Scene } from 'phaser';
import { CreatureController } from './creature';
import { DirectionEnum } from './move-module';
import { Separate } from './physics';
import { BattleField } from './battle-field';

const onCreate = (scene: Scene) => {
    // const music = scene.sound.add('bgm', { loop: true });
    // music.play();
    const field: BattleField = new BattleField(scene, 'tilemap');

    const Cardic = new LocalSquad(scene, 'Cardic', { x: 550, y: 350 });
    [
        [0, 'Aless'],
        [1, 'Errane'],
        [2, 'Alfred'],
        ...Array.from({ length: 3 }).map((_, index) => ([85, `CGeneral${index + 1}`])),
        ...Array.from({ length: 6 }).map((_, index) => ([84, `CSoldier${index + 1}`])),
    ].forEach(([no, name]) => {
        const character = new Character(scene, +no, `${name}`);
        const creatureController = new CreatureController(scene, character, +no, 1);
        Cardic.add(scene, character, creatureController, DirectionEnum.down);
    });
    Cardic.follow(scene);
    field.addSquad(scene, Cardic, "Cardic");

    const Varcia = new Squad(scene, 'Varcia', { x: 550, y: 650 }, defaultFormation, DirectionEnum.up);
    [
        [29, 'John'],
        [30, 'Xenel'],
        [49, 'VWarrior'],
        ...Array.from({ length: 3 }).map((_, index) => ([50, `VKnight${index + 1}`])),
        ...Array.from({ length: 6 }).map((_, index) => ([58, `VSoldier${index + 1}`])),
    ].forEach(([no, name]) => {
        const character = new Character(scene, +no, `${name}`);
        const creatureController = new CreatureController(scene, character, +no, 99);
        Varcia.add(scene, character, creatureController, DirectionEnum.up);
    });
    field.addSquad(scene, Varcia, "Varcia");

    scene.physics.add.collider(Cardic.group, Cardic.group, (lhs, rhs) => {
        const lhsBody = lhs.body as Phaser.Physics.Arcade.Body;
        const rhsBody = rhs.body as Phaser.Physics.Arcade.Body;
        Separate(lhsBody, rhsBody);
    });

    // const leader = Cardic.squadrons[0].character;
    // if (leader.sprite)
    //     scene.physics.add.overlap(leader.sprite, warpzones, (lhs, rhs) => {
    //         const warp = lhs.getData('warp');
    //         if (warp) {
    //             rhs.body.reset(warp.x, warp.y);
    //             const rhsChar: Character = rhs.getData('character');
    //             console.log(`${rhsChar.name} jumps to ${warp.x}, ${warp.y}`);
    //         }
    //     });
}

const Stage = () => {
    React.useEffect(() => {
        Preload.on((scene: Scene) => {
            scene.events.on('create', () => onCreate.call(this, scene));
            scene.load.image('base_tiles', 'assets/buch-outdoor2.png');
            scene.load.tilemapTiledJSON('tilemap', 'assets/battle.json');
            scene.load.audio('bgm', ['assets/audio/BGM14.mp3']);
        });
    }, []);

    return (
        <></>
    );
};

export default Stage;