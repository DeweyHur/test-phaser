import React from 'react';
import { Preload, Create } from './game';
import { Character } from './character';
import { bindCharacter } from './local-keyboard';

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

            const hero = new Character(scene, 0, '0', { x: 300, y: 400 });
            bindCharacter(hero);
            new Character(scene, 1, '1', { x: 350, y: 400 });
            new Character(scene, 2, '2', { x: 400, y: 400 });
            new Character(scene, 3, '3', { x: 450, y: 400 });
            new Character(scene, 4, '4', { x: 500, y: 400 });
        });
    }, []);

    return (
        <div ref={ref}>
        </div>
    );
};

export default Stage;