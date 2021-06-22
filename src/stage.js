import React from 'react';
import { Preload, Create } from './game';
import Character from './character';

const Stage = () => {
    const ref = React.useRef(null);

    React.useEffect(() => {
        Preload.on((scene) => {
            scene.load.image('base_tiles', 'assets/buch-outdoor.png');
            scene.load.tilemapTiledJSON('tilemap', 'assets/outside.json');        
        });
        Create.on((scene) => {
            const map = scene.make.tilemap({ key: 'tilemap' });
            const tileset = map.addTilesetImage('outdoor', 'base_tiles');
            map.createLayer('Ground', tileset);
            map.createLayer('Fringe', tileset);

            new Character(scene, 'dwarf', { x: 400, y: 400, state: 'Move' });
        });
    }, []);

    return (
        <div ref={ref}>
        </div>
    );
};

export default Stage;