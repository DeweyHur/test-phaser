import { Scene } from 'phaser';
import { BattleField, NearestEnemyMoveModule } from './battle-field';
import { Character, Position } from './character';
import { CreatureController } from './creature';
import { KeyEnum, KeyEventEnum, keyOff, keyOn } from './local-keyboard';
import { DirectionEnum, DirectionType, MoveAgentEventEnum, IdleMoveModule, PointMoveModule, LocalMoveModule } from './move-module';
import { Separate } from './physics';

export interface SpawnInfo {
    character: Character;
    pos: Phaser.Math.Vector2;
}

export interface Squadron {
    spawn(scene: Scene, pos: Position, dir: DirectionType): Phaser.Types.Physics.Arcade.GameObjectWithDynamicBody;
}

type Formation = { x: number, y: number }[];
export const defaultFormation: Formation = [
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

interface MoveModules {
    idle: IdleMoveModule;
    formation: FormationMoveModule;
    follow: FollowMoveModule;
    local?: LocalMoveModule;
    nearestEnemy?: NearestEnemyMoveModule;
}

export interface SquadronHelper {
    character: Character;
    moveModules: MoveModules;
    creatureController: CreatureController;
}

class FormationMoveModule extends PointMoveModule {
    constructor(
        src: Phaser.Physics.Arcade.Body,
        public squad: Squad,
        public index: number,
    ) {
        super(src);
    }

    update(scene: Scene) {
        this.dest = this.squad.squadronPosition(this.index) || { x: this.src.x, y: this.src.y };
    }
}

class FollowMoveModule extends PointMoveModule {
    constructor(
        src: Phaser.Physics.Arcade.Body,
        public target: Phaser.Physics.Arcade.Body,
    ) {
        super(src);
    }

    update(scene: Scene) {
        this.dest = { x: this.target.x, y: this.target.y };
    }
}

export class Squad {
    group: Phaser.Physics.Arcade.Group;
    squadrons: SquadronHelper[];
    field?: BattleField;

    constructor(
        scene: Scene,
        protected name: string,
        protected spawnPoint: Position = { x: 550, y: 350 },
        protected formation: Formation = defaultFormation,
        protected dir: DirectionType = DirectionEnum.down,
    ) {
        this.name = name;
        this.group = scene.physics.add.group();
        this.squadrons = [];
        this.registerInternalOverlap(scene);
        scene.events.on('preupdate', () => this.recoverPosition.call(this, scene));
        scene.events.on('preupdate', () => this.onPreUpdate.call(this, scene));
    }

    registerInternalOverlap(scene: Scene) {
        scene.physics.add.overlap(this.group, this.group, (lhs, rhs) => {
            const lhsBody = lhs.body as Phaser.Physics.Arcade.Body;
            const rhsBody = rhs.body as Phaser.Physics.Arcade.Body;
            Separate(lhsBody, rhsBody);
        });
    }

    setBattleField(field: BattleField) {
        this.field = field;
        for (const { character, creatureController, moveModules } of this.squadrons) {
            moveModules.nearestEnemy = new NearestEnemyMoveModule(character, creatureController, this, field);
        }
    }

    squadronPosition(index: number): Position | null {
        const length = this.squadrons.length;
        if (0 < length && length < this.formation.length) {
            const leader = this.squadrons[0].character;
            if (!leader.sprite) return this.spawnPoint;
            const func = formationRotation[this.dir];
            const mod = func(this.formation[index]);
            const { x, y } = leader.sprite.body.position
            return { x: x + mod.x, y: y + mod.y };
        }
        else if (0 === length) {
            return this.spawnPoint;
        }
        else {
            return null;
        }
    }

    protected addInternal(scene: Scene, character: Character, dir: DirectionType): boolean {
        const pos = this.squadronPosition(this.squadrons.length);
        if (!pos) return false;
        console.log(`Spawning ${character.name} to ${pos.x},${pos.y}`);

        const sprite = character.spawn(scene, pos, dir);
        sprite.setData('character', character);
        character.once(MoveAgentEventEnum.dead, () => {
            this.remove(scene, character)
        });
        this.group.add(sprite);
        sprite.body.customSeparateX = true;
        sprite.body.customSeparateY = true;
        return true;
    }

    protected recoverPosition(scene: Scene) {
        this.squadrons.forEach(({ character }, index) => {
            if (!character.position) return;
            if (!character.sprite) return;
            if (Number.isNaN(character.sprite.body.x)) {
                character.sprite.body.x = character.position.x;
                console.error(`Position recovered X[${index}]`);
            }
            if (Number.isNaN(character.sprite.body.y)) {
                character.sprite.body.y = character.position.y;
                console.error(`Position recovered X[${index}]`);
            }
            character.position.x = character.sprite.body.x;
            character.position.y = character.sprite.body.y;
        });
    }

    protected onPreUpdate(scene: Scene) {
        this.squadrons.forEach(({ moveModules, character, creatureController }, index) => {
            if (creatureController.hp <= 0) return;
            if (!character.sprite) return;
            const dest = this.squadronPosition(index);
            if (!dest) return;

            if (moveModules.nearestEnemy) {
                moveModules.nearestEnemy.update(scene);
                creatureController.nextMove = moveModules.nearestEnemy.next();
            } else {
                moveModules.formation.update(scene);
                creatureController.nextMove = moveModules.formation.next();
            }
            character.setNextMove(creatureController.nextMove.moving, creatureController.nextMove.dir);
        });
    }

    add(scene: Scene, character: Character, creatureController: CreatureController, dir: DirectionType): boolean {
        if (!this.addInternal(scene, character, dir)) return false;
        const moveModules: MoveModules = {
            idle: new IdleMoveModule(),
            formation: new FormationMoveModule(character.sprite.body, this, this.squadrons.length),
            follow: new FollowMoveModule(character.sprite.body, character.sprite.body)
        };
        if (this.field) {
            moveModules.nearestEnemy = new NearestEnemyMoveModule(character, creatureController, this, this.field);
        }
        const squadron: SquadronHelper = { character, moveModules, creatureController };
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

    add(scene: Scene, character: Character, creatureController: CreatureController, dir: DirectionType): boolean {
        if (!this.addInternal(scene, character, dir)) return false;
        if (!character.sprite) return false;
        const moveModules: MoveModules = {
            idle: new IdleMoveModule(),
            local: new LocalMoveModule(),
            formation: new FormationMoveModule(character.sprite.body, this, this.squadrons.length),
            follow: new FollowMoveModule(character.sprite.body, character.sprite.body),
        };
        if (this.field) {
            moveModules.nearestEnemy = new NearestEnemyMoveModule(character, creatureController, this, this.field);
        }
        const squadron: SquadronHelper = { character, moveModules, creatureController };
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

    protected onPreUpdate(scene: Scene) {
        this.squadrons.forEach(({ moveModules, character, creatureController }, index) => {
            if (creatureController.hp <= 0) return;
            if (!character.sprite) return;
            const dest = this.squadronPosition(index);
            if (!dest) return;

            const avatar = this.avatar();
            if (moveModules.local && avatar && avatar.character === character) {
                creatureController.nextMove = moveModules.local.next();
            }
            else if (moveModules.nearestEnemy) {
                moveModules.nearestEnemy.update(scene);
                creatureController.nextMove = moveModules.nearestEnemy.next();
            }
            else {
                moveModules.formation.update(scene);
                creatureController.nextMove = moveModules.formation.next();
            }
            character.setNextMove(creatureController.nextMove.moving, creatureController.nextMove.dir);
        });

    }

    avatar(): SquadronHelper | null {
        if (!this.local) return null;
        if (this.cursor === undefined) return null;
        return this.squadrons[this.cursor];
    }

    changeAvatar(scene: Scene, cursor: number | null) {
        if (!this.local) return;

        if (cursor === null) {
            delete this.cursor;
        } else {
            this.cursor = cursor;
            const avatar = this.avatar();
            if (avatar) {
                const sprite = avatar.character.sprite;
                if (sprite) {
                    scene.cameras.main.startFollow(sprite, true, 0.05, 0.05);
                }
            }
        }
    }
}