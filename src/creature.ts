import { Scene } from 'phaser';
import { Preload } from './game';
import parse from 'csv-parse';
import { PhaserEventManager } from './phaser-event-manager';

export const StatEnum = { hp: 'hp', hr: 'hr', at: 'at', ar: 'ar', df: 'df', dr: 'dr', aa: 'aa', ad: 'ad', md: 'md' }
export type StatType = typeof StatEnum[keyof typeof StatEnum];

export const characterPool: { [key: number]: any } = {};
export const getBaseStat = (no: number) => characterPool[no];

Preload.on(async (scene: Scene) => {
    scene.load.multiatlas('characters', 'assets/characters.json', 'assets');

    const res = await fetch('/assets/characters.csv');
    const body = await res.text();
    parse(body, { columns: true }, (err, records) => {
        if (err) throw err;
        records.forEach((record: any) => {
            Object.keys(StatEnum).forEach(key => record[key] = +record[key]);
            characterPool[record.no] = record;
        });
    });
});

export interface Creature {
    alive(): boolean;
    pos(): Phaser.Math.Vector2 | null;
    onHit(): void;
    onDead(): void;
    actionable(): boolean;
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
    stats: { [key in StatType]: number };
    hpText?: Phaser.GameObjects.Text;
    eventManager: PhaserEventManager;
    missCount: number;

    constructor(
        scene: Scene,
        public creature: Creature,
        public no: number,
        public lv: number,
    ) {
        this.ft = 0;
        this.exp = 0;
        this.stats = {};
        const stat = getBaseStat(no);
        Object.entries(statMod).forEach(([key, eq]) => this.stats[key] = eq(stat[key], lv));
        this.hp = this.stats[StatEnum.hp];
        this.missCount = 0;
        this.eventManager = new PhaserEventManager();
        this.eventManager.on(this, scene, 'postupdate', this.onPostUpdate);
    }

    off(scene: Scene) {
        this.eventManager.off(scene);
        if (this.hpText) this.hpText.removeFromDisplayList();
    }

    onPostUpdate(scene: Scene) {
        if (this.hp <= 0) return;
        this.updateIndicator(scene);
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

    stat(key: StatType): number {
        switch (key) {
            case StatEnum.at: case StatEnum.ar: case StatEnum.df: case StatEnum.dr:
                return ~~(this.stats[key] - this.ft);
            default:
                return this.stats[key];
        }
    }

    hitBy(scene: Scene, attacker: CreatureController) {
        if (!this.creature.actionable() || !attacker.creature.actionable()) return;

        const hitChance = 0.05 + (attacker.stat(StatEnum.ar) - this.stat(StatEnum.dr)) / 100 * 0.04;
        
        if (Math.random() < hitChance) {
            console.log(`Hit per ${this.missCount}`);
            const at = attacker.stat(StatEnum.at);
            const df = attacker.stat(StatEnum.df);
            const min = Math.max(1, at - df * 2);
            const max = Math.max(1, at - df);
            const damage = ~~(min + Math.random() * (max - min));
            this.hp = this.hp - damage;
            this.ft += 0.05;
            if (this.hp > 0) {
                this.creature.onHit();
            }
            else {
                this.creature.onDead();
            }
        }
        else {
            ++this.missCount;
        }
    }

}