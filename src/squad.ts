import { Scene } from 'phaser';
import { Update } from './game';
import { Character } from './character';

export class Squad {
    scene: Scene;
    name: string;
    group: Phaser.Physics.Arcade.Group;
    characters: Character[];
    cursor?: number;

    constructor(scene: Scene, name: string) {
        this.name = name;
        this.scene = scene;
        this.group = scene.physics.add.group({
            bounceX: 1, bounceY: 1
        });
        this.characters = [];
        Update.on((scene: Scene) => {
            this.characters.forEach(character => {
                
            });
        });
    }

    add(...characters: Character[]) {
        this.characters = [...this.characters, ...characters];
        characters.forEach(x => this.group.add(x.sprite));
        if (this.characters.length > 0) {
            this.cursor = this.cursor || 0;
        }
    }

    shift() {
        if( this.cursor !== undefined ) {
            this.cursor = (this.cursor + 1) % this.characters.length;
        }
    }

    unshift() {
        if( this.cursor !== undefined ) {
            this.cursor = (this.cursor + this.characters.length - 1) % this.characters.length;
        }
    }

    avatar(): Character|null {
        return this.cursor !== undefined? this.characters[this.cursor] : null;
    }

}