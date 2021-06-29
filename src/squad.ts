import { Scene } from 'phaser';
import { Character } from './character';
import { KeyEnum, KeyEventEnum, keyOff, keyOn } from './local-keyboard';

export interface SpawnInfo {
    character: Character;
    pos: Phaser.Math.Vector2;
}

export interface Squadron {
    spawn(scene: Scene, pos: Phaser.Math.Vector2): Phaser.GameObjects.Sprite;
}

export class Squad {
    group: Phaser.Physics.Arcade.Group;
    characters: Character[];

    constructor(
        scene: Scene,
        protected name: string
    ) {
        this.name = name;
        this.group = scene.physics.add.group({
            bounceX: 0, bounceY: 0
        });
        this.characters = [];
    }

    add(scene: Scene, character: Character, x: number, y: number) {
        const sprite = character.spawn(scene, new Phaser.Math.Vector2(x, y));
        sprite.setData('character', character);
        this.group.add(sprite);
    }

    remove(character: Character): number {
        const index = this.characters.findIndex(x => x === character);
        this.characters.splice(index, 1);
        return index;
    }
}

export class LocalSquad extends Squad {
    cursor?: number;
    local: boolean;

    constructor(
        scene: Scene,
        name: string
    ) {
        super(scene, name);
        this.local = false;
    }

    add(scene: Scene, character: Character, x: number, y: number) {
        super.add(scene, character, x, y);

        if (this.characters.length > 0) {
            this.changeAvatar(0);
        }
    }

    remove(character: Character): number {
        const index = super.remove(character);
        if (this.characters.length === 0) {
            this.changeAvatar(null);
        } else if (index === this.cursor) {
            this.changeAvatar((index + 1) % this.characters.length);
        } else {
            this.changeAvatar(index % this.characters.length);
        }
        return index;
    }

    follow(scene: Scene) {
        const avatar = this.avatar();
        if (!avatar) return;
        const sprite = avatar.sprite;
        if (!sprite) return;
        scene.cameras.main.startFollow(sprite, true, 0.05, 0.05);
        keyOn(KeyEventEnum.down, KeyEnum.shift, this.shift);
        keyOn(KeyEventEnum.down, KeyEnum.unshift, this.unshift);
        this.local = true;
    }

    unfollow(scene: Scene) {
        scene.cameras.main.stopFollow();
        keyOff(KeyEventEnum.down, KeyEnum.shift, this.shift);
        keyOff(KeyEventEnum.down, KeyEnum.unshift, this.unshift);
        this.local = false;
    }

    protected shift() {
        if (!this.local) return;
        if (this.cursor === undefined) return;
        this.changeAvatar((this.cursor + 1) % this.characters.length);
    }

    protected unshift() {
        if (!this.local) return;
        if (this.cursor === undefined) return;
        this.changeAvatar((this.cursor + this.characters.length - 1) % this.characters.length);
    }

    avatar(): Character | null {
        if (!this.local) return null;
        if (this.cursor === undefined) return null;
        return this.characters[this.cursor];
    }

    changeAvatar(cursor: number | null) {
        if (!this.local) return;
        if (this.cursor === undefined) return;
        if (cursor === null) {
            delete this.cursor;
        } else {
            this.cursor = cursor;
        }
    }
}

