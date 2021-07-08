import { Scene } from "phaser";
import { AvoidMoveModule, NearestEnemyMoveModule } from "./battle-field";
import { HpGradeEnum, HpGradeType } from "./creature";
import { Idle } from "./move-module";
import { DirectionType } from "./physics";
import { FormationMoveModule } from "./squad";

export interface MovePicker {
    update(scene: Scene): void;
    pick(scene: Scene, grade: HpGradeType): { moving: boolean, dir?: DirectionType };
}

export class NeutralMovePicker implements MovePicker {
    constructor(
        protected nearest: NearestEnemyMoveModule,
        protected formation: FormationMoveModule,
        protected avoid: AvoidMoveModule,
    ) { }

    update(scene: Scene) {
        this.nearest.update(scene);
        this.formation.update(scene);
        this.avoid.update(scene);
    }

    pick(scene: Scene, grade: HpGradeType) {
        switch (grade) {
            case HpGradeEnum.good: {
                let move = this.nearest.next(scene);
                if (move === Idle) return this.formation.next(scene);
                else return move;
            } break;
            case HpGradeEnum.tired:
            case HpGradeEnum.danger: {
                return this.avoid.next(scene);
            } break;
            default:
                return Idle;
        }
    }
}

