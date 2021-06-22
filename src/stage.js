import React from 'react';
import Phaser from 'phaser';
import Character from './character';

function preload() {
    this.load.image('base_tiles', 'assets/buch-outdoor.png');
    this.load.tilemapTiledJSON('tilemap', 'assets/outside.json');
}

function create() {
    const map = this.make.tilemap({ key: 'tilemap' });
    const tileset = map.addTilesetImage('outdoor', 'base_tiles');
    map.createLayer('Ground', tileset);
    map.createLayer('Fringe', tileset);

    new Character(this, 'dwarf', { x: 400, y: 400, state: 'Move' });
}

const Stage = () => {
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

export default Stage;