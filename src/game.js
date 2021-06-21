import React from 'react';
import Phaser from 'phaser';

function preload() {
    this.load.multiatlas('dwarf', 'assets/dwarf.json', 'assets');
    this.load.image('base_tiles', 'assets/buch-outdoor.png');
    this.load.tilemapTiledJSON('tilemap', 'assets/outside.json');
}

function create() {
    const map = this.make.tilemap({ key: 'tilemap' });
    const tileset = map.addTilesetImage('outdoor', 'base_tiles');
    map.createLayer('Ground', tileset);
    map.createLayer('Fringe', tileset);

    const dwarf = this.add.sprite(400, 400, 'dwarf', 'Move/1.png');
    const frameNames = this.anims.generateFrameNames('dwarf', { start: 1, end: 2, prefix: 'Move/', suffix: '.png' });
    this.anims.create({ key: 'move', frames: frameNames, frameRate: 10, repeat: -1 });
    dwarf.anims.play('move');
}

const Game = () => {
    const ref = React.useRef(null);
    const [game, setGame] = React.useState(0);

    React.useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 200 } }
            },
            scene: { preload, create }
        }

        setGame(new Phaser.Game(config));
    }, []);

    return (
        <div ref={ref}>
        </div>
    );
};

export default Game;