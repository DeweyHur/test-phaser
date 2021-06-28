import { Scene } from 'phaser';
import { Update } from './game';
import { Character } from './character';

export class Squad {
    scene: Scene;
    name: string;
    group: Phaser.Physics.Arcade.Group;
    characters: Character[];
    cursor: number|null;

    constructor(scene: Scene, name: string) {
        this.name = name;
        this.scene = scene;
        this.group = scene.physics.add.group({
            bounceX: 0, bounceY: 0
        });
        this.cursor = null;
        this.characters = [];
        Update.on((scene: Scene) => {
            this.characters.forEach(character => {

            });
        });
    }

    add(...characters: Character[]) {
        this.characters = [...this.characters, ...characters];
        characters.forEach(x => {
            this.group.add(x.sprite);
            x.squad = this;
        });
        if (this.characters.length > 0) {
            this.changeAvatar(0);
        }
    }

    remove(character: Character) {
        const index = this.characters.findIndex(x => x === character);
        this.characters.splice(index, 1);
        if (this.characters.length === 0) {
            this.changeAvatar(null);
        } else if (index === this.cursor) {
            this.changeAvatar((index + 1) % this.characters.length);
        } else {
            this.changeAvatar(index % this.characters.length);
        }
    }

    changeAvatar(cursor: number|null) {
        if (cursor !== null && cursor !== this.cursor) {
            let avatar: Character | null = this.avatar();
            if (avatar) {
                avatar.local = false;
            }
            this.cursor = cursor;
            avatar = this.avatar();
            if (avatar) {
                avatar.local = true;
            }
        }
    }

    shift() {
        if (this.cursor !== null) {
            this.changeAvatar((this.cursor + 1) % this.characters.length);
        }
    }

    unshift() {
        if (this.cursor !== null) {
            this.changeAvatar((this.cursor + this.characters.length - 1) % this.characters.length);
        }
    }

    avatar(): Character | null {
        return this.cursor !== null ? this.characters[this.cursor] : null;
    }

}