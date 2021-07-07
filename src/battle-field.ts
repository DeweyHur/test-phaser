import { Scene } from "phaser";
import { BattleMap } from "./battle-map";
import { Character } from "./character";
import { CreatureController } from "./creature";
import { PointMoveModule } from "./move-module";
import { AxisEnum, AxisType, ConvertToDir, Separate } from "./physics";
import { Squad, SquadronHelper } from "./squad";

interface SquadInfo {
    squad: Squad;
    team: String;
}

export class NearestEnemyMoveModule extends PointMoveModule {
    enemy: Phaser.Physics.Arcade.Sprite;

    constructor(
        scene: Scene,
        protected agent: Character,
        protected controller: CreatureController,
        protected squad: Squad,
        protected field: BattleField,
    ) {
        super(scene, agent.sprite.body);
        this.enemy = agent.sprite;
    }

    update(scene: Scene) {
        const enemies = this.field.enemies(this.squad);
        const groups = enemies.map(x => x.group);
        const objects = [...groups.map(x => x.children.entries).flat()];
        const { min, target } = objects.reduce<{ min: number, target?: Phaser.GameObjects.GameObject }>((prev, obj) => {
            const distance = Math.abs(obj.body.position.x - this.src.x) + Math.abs(obj.body.position.y - this.src.y);
            if (distance < prev.min) {
                prev.min = distance;
                prev.target = obj;
            }
            return prev;
        }, {
            min: Phaser.Math.MAX_SAFE_INTEGER
        });
        if (!target) return;
        this.enemy = target as Phaser.Physics.Arcade.Sprite;
        const { x = this.src.x, y = this.src.y } = this.enemy;
        this.dest = { x, y };
    }

    next(scene: Scene) {
        const d: { [key in AxisType]: number } = { x: this.enemy.x - this.src.x, y: this.enemy.y - this.src.y };

        const distance = Math.max(Math.abs(d.x), Math.abs(d.y));
        const bar = (this.src.width + this.enemy.width) / 2;
        if (distance <= bar) {
            if (Math.abs(d.x) > Math.abs(d.y)) return this.wrapMove(AxisEnum.x, ConvertToDir(AxisEnum.x, d.x));
            else return this.wrapMove(AxisEnum.y, ConvertToDir(AxisEnum.y, d.y));
        }
        return super.next(scene);
    }
}

export class BattleField {
    map: BattleMap;
    squads: SquadInfo[];
    turn: number;

    constructor(scene: Scene, mapKey: string) {
        this.squads = [];
        this.map = new BattleMap(scene, mapKey);
        this.map.setActive(scene);
        this.turn = 0;
        scene.events.on('update', () => ++this.turn);
    }

    enemies(squad: Squad): Squad[] {
        const info = this.squads.find(x => x.squad === squad);
        if (!info) return [];
        return this.squads
            .filter(x => info.team !== x.team)
            .map(x => x.squad);
    }

    addSquad(scene: Scene, squad: Squad, team: string) {
        this.map.assignGroup(scene, squad.group);
        squad.setBattleField(scene, this);
        this.squads
            .filter(info => team !== info.team)
            .forEach(info => {
                scene.physics.add.overlap(squad.group, info.squad.group, (lhs, rhs) => {
                    const lhsBody = lhs.body as Phaser.Physics.Arcade.Body;
                    const rhsBody = rhs.body as Phaser.Physics.Arcade.Body;
                    Separate(lhsBody, rhsBody);

                    const { character: lhschar, creatureController: lhsController }: SquadronHelper = lhs.getData('squadron');
                    const { character: rhschar, creatureController: rhsController }: SquadronHelper = rhs.getData('squadron');
                    lhsController.hitBy(scene, rhsController);
                    rhsController.hitBy(scene, lhsController);
                    // console.log(`Turn ${this.turn}: ${lhschar.name} <-> ${rhschar.name}`);
                });
            });
        this.squads.push({ squad, team });
    }
}
