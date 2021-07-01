import { Scene } from 'phaser';
import { Character, Position } from './character';
import { CreatureController } from './creature';
import { KeyEnum, KeyEventEnum, keyOff, keyOn } from './local-keyboard';
import { DirectionType, idleMoveModule, localMoveModule, MoveAgentEventEnum, MoveModule } from './move-module';

export interface SpawnInfo {
    character: Character;
    pos: Phaser.Math.Vector2;
}

export interface Squadron {
    spawn(scene: Scene, pos: Phaser.Math.Vector2): Phaser.GameObjects.Sprite;
}

type Formation = { x: number, y: number }[];
const defaultFormation: Formation = [
    { x: 0, y: 0 },
    { x: -64, y: 0 },
    { x: 64, y: 0 },
    { x: -128, y: 0 },
    { x: 128, y: 0 },
    { x: -192, y: 0 },
    { x: 192, y: 0 },
    { x: 0, y: -64 },
    { x: -64, y: -64 },
    { x: 64, y: -64 },
    { x: -128, y: -64 },
    { x: 128, y: -64 },
    { x: -256, y: -64 },
    { x: 256, y: -64 },
]

const formationRotation: { [key in DirectionType]: Function } = {
    down: ({ x, y }: Position) => ({ x, y }),
    left: ({ x, y }: Position) => ({ x: -y, y: x }),
    up: ({ x, y }: Position) => ({ x: -x, y: -y }),
    right: ({ x, y }: Position) => ({ x: y, y: -x }),
};

export interface SquadronController {
    character: Character;
    moveModule: MoveModule;
    creatureController: CreatureController;
}

export class Squad {
    group: Phaser.Physics.Arcade.Group;
    squadrons: SquadronController[];

    constructor(
        scene: Scene,
        protected name: string,
        protected spawnPoint: Position = { x: 550, y: 350 },
        protected formation: Formation = defaultFormation,
    ) {
        this.name = name;
        this.group = scene.physics.add.group();
        this.squadrons = [];
        scene.events.on('preupdate', () => this.onPreUpdate.call(this, scene));
    }

    protected squadronPosition(index: number): Position | null {
        const length = this.squadrons.length;
        if (0 < length && length < this.formation.length) {
            const leader = this.squadrons[0].character;
            if (!leader.sprite) return new Phaser.Math.Vector2(this.spawnPoint);
            const func = formationRotation[leader.dir];
            const mod = func(this.formation[index]);
            const { x, y } = leader.sprite.body.position
            return { x: x + mod.x, y: y + mod.y };
        }
        else if (0 === length) {
            return new Phaser.Math.Vector2(this.spawnPoint);
        }
        else {
            return null;
        }
    }

    protected addInternal(scene: Scene, character: Character): boolean {
        const pos = this.squadronPosition(this.squadrons.length);
        if (!pos) return false;
        console.log(`Spawning ${character.name} to ${pos.x},${pos.y}`);

        const sprite = character.spawn(scene, pos);
        sprite.setData('character', character);
        character.once(MoveAgentEventEnum.dead, () => this.remove(scene, character));
        this.group.add(sprite);
        return true;
    }

    protected onPreUpdate(scene: Scene) {
        this.squadrons.forEach(({ moveModule, character, creatureController }) => {
            if (creatureController.hp <= 0) return;
            const { moving, dir } = moveModule(scene);
            character.setNextMove(moving, dir);
        });
    }

    add(scene: Scene, character: Character, creatureController: CreatureController): boolean {
        if (!this.addInternal(scene, character)) return false;
        const squadron: SquadronController = { character, moveModule: idleMoveModule, creatureController };
        this.squadrons.push(squadron);
        if (character.sprite) character.sprite.setData('squadron', squadron);
        return true;
    }

    remove(scene: Scene, character: Character): number {
        const index = this.squadrons.findIndex(x => x.character === character);
        const { creatureController } = this.squadrons.splice(index, 1)[0];
        creatureController.off(scene);

        if (!character.sprite) return index;
        character.sprite.destroy();

        return index;
    }
}

export class LocalSquad extends Squad {
    cursor?: number;
    local: boolean;

    constructor(
        scene: Scene,
        name: string,
        spawnPoint: Position = { x: 550, y: 350 },
        formation: Formation = defaultFormation,
    ) {
        super(scene, name, spawnPoint, formation);
        this.local = false;
    }

    add(scene: Scene, character: Character, creatureController: CreatureController): boolean {
        if (!this.addInternal(scene, character)) return false;
        const squadron: SquadronController = { character, moveModule: idleMoveModule, creatureController };
        this.squadrons.push(squadron);
        if (character.sprite) character.sprite.setData('squadron', squadron);
        if (this.squadrons.length === 1) {
            this.changeAvatar(scene, 0);
        }
        return true;
    }

    remove(scene: Scene, character: Character): number {
        const index = super.remove(scene, character);
        if (this.squadrons.length === 0) {
            this.changeAvatar(scene, null);
        } else if (index === this.cursor) {
            this.changeAvatar(scene, (index + 1) % this.squadrons.length);
        } else {
            this.changeAvatar(scene, index % this.squadrons.length);
        }
        return index;
    }

    follow(scene: Scene): boolean {
        if (this.squadrons.length === 0) return false;
        this.local = true;
        this.changeAvatar(scene, 0);
        const avatar = this.avatar();
        if (!avatar) return false;
        const sprite = avatar.character.sprite;
        if (!sprite) return false;
        scene.cameras.main.startFollow(sprite, true, 0.05, 0.05);
        keyOn(KeyEventEnum.down, KeyEnum.shift, () => this.shift.call(this, scene));
        keyOn(KeyEventEnum.down, KeyEnum.unshift, () => this.unshift.call(this, scene));
        return true;
    }

    unfollow(scene: Scene) {
        scene.cameras.main.stopFollow();
        keyOff(KeyEventEnum.down, KeyEnum.shift, () => this.shift.call(this, scene));
        keyOff(KeyEventEnum.down, KeyEnum.unshift, () => this.unshift.call(this, scene));
        this.local = false;
        this.changeAvatar(scene, null);
    }

    protected shift(scene: Scene) {
        if (!this.local) return;
        if (this.cursor === undefined) return;
        this.changeAvatar(scene, (this.cursor + 1) % this.squadrons.length);
    }

    protected unshift(scene: Scene) {
        if (!this.local) return;
        if (this.cursor === undefined) return;
        this.changeAvatar(scene, (this.cursor + this.squadrons.length - 1) % this.squadrons.length);
    }

    avatar(): SquadronController | null {
        if (!this.local) return null;
        if (this.cursor === undefined) return null;
        return this.squadrons[this.cursor];
    }

    changeAvatar(scene: Scene, cursor: number | null) {
        if (!this.local) return;

        const avatar = this.avatar();
        if (avatar) {
            avatar.moveModule = idleMoveModule;
        }
        if (cursor === null) {
            delete this.cursor;
        } else {
            this.cursor = cursor;
            const avatar = this.avatar();
            if (avatar) {
                avatar.moveModule = localMoveModule;
                if (avatar.character.sprite)
                    scene.cameras.main.startFollow(avatar.character.sprite, true, 0.05, 0.05);
            }
        }
    }
}