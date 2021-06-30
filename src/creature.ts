import { Scene } from 'phaser';
import { Preload } from './game';
import parse from 'csv-parse';

export const StatEnum = { hp: 'hp', hr: 'hr', at: 'at', ar: 'ar', df: 'df', dr: 'dr', aa: 'aa', ad: 'ad', md: 'md' }
export type StatType = typeof StatEnum[keyof typeof StatEnum];

const pool: { [key: number]: any } = {};
export const getBaseStat = (no: number) => pool[no];

Preload.on(async (scene: Scene) => {
    scene.load.multiatlas('characters', 'assets/characters.json', 'assets');

    const res = await fetch('/assets/characters.csv');
    const body = await res.text();
    parse(body, { columns: true }, (err, records) => {
        if (err) throw err;
        records.forEach((record: any) => {
            Object.keys(StatEnum).forEach(key => record[key] = +record[key]);
            pool[record.no] = record;
        });
    });
});

export interface Creature {
    alive(): boolean;
    pos(): Phaser.Math.Vector2 | null;
    stat(key: StatType): number;
    setStat(key: StatType, stat: number): Creature;
    onHit(): void;
    onDead(): void;
}

type StatEq = (base: number, lv: number) => number;
const statMod: { [key in StatType]: StatEq } = {
    hp: (base: number, lv: number) => base + lv * 5,
    hr: (base: number, lv: number) => base + ~~((lv + 11) / 12),
    at: (base: number, lv: number) => base + ~~((lv + 3) / 4),
    ar: (base: number, lv: number) => base + ~~((lv + 2) / 4),
    df: (base: number, lv: number) => base + ~~((lv + 1) / 4),
    dr: (base: number, lv: number) => base + ~~((lv) / 4),
    aa: (base: number, lv: number) => base,
    ad: (base: number, lv: number) => base,
    md: (base: number, lv: number) => base,
}

export class CreatureController {
    hp: number;
    ft: number;
    exp: number;
    hpText?: Phaser.GameObjects.Text;

    constructor(
        scene: Scene,
        public creature: Creature,
        public no: number,
        public lv: number,
    ) {
        this.ft = 0;
        this.exp = 0;
        const stat = getBaseStat(no);
        Object.entries(statMod).forEach(([key, eq]) => creature.setStat(key, eq(stat[key], lv)));
        this.hp = creature.stat(StatEnum.hp);

        scene.events.on('postupdate', (scene: Scene) => {
            if (!creature.alive()) return;
            this.updateIndicator(scene);
        });
    }

    protected updateIndicator(scene: Scene) {
        const pos = this.creature.pos();
        if (!pos) return;
        const { x, y } = pos;
        if (!this.hpText) {
            this.hpText = scene.add.text(x - 8, y + 16, `${this.hp}`, {
                color: '#000000', fontSize: '16px', align: 'center', fontStyle: 'strong'
            });
        }
        else {
            this.hpText.setX(x - 8);
            this.hpText.setY(y + 16);
        }
        this.hpText.setText(`${this.hp}`);
    }

    hitBy(scene: Scene, opponent: Creature) {
        if (!this.creature.alive() || !opponent.alive()) return;
        const hitChance = 0.05 + (opponent.stat('ar') - this.creature.stat('dr')) / 100 * 0.04;
        if (Math.random() < hitChance) {
            const damage = ~~(5 + (opponent.stat('at') - this.creature.stat('df')) / 100 * 4);
            this.hp = this.hp - damage;
            if (this.hp > 0) {
                this.creature.onHit();
            }
            else {
                this.creature.onDead();
            }
        }
    }

}