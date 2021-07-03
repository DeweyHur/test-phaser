import { Scene } from "phaser";

export class BattleMap {
    map: Phaser.Tilemaps.Tilemap;
    tileset: Phaser.Tilemaps.Tileset;
    warpzones: Phaser.GameObjects.GameObject[];
    warpzonesLayer: Phaser.Tilemaps.ObjectLayer;
    obstacles: Phaser.Tilemaps.TilemapLayer;

    constructor(scene: Scene, key: string) {
        this.map = scene.make.tilemap({ key });
        this.tileset = this.map.addTilesetImage('istanbul', 'base_tiles');
        this.warpzones = this.map.createFromObjects('warpzones', { scene });
        this.warpzonesLayer = this.map.getObjectLayer('warpzones');
        this.warpzones.forEach((warpzone) => {
            scene.physics.add.existing(warpzone);
            const warpId = warpzone.getData('warp');
            if (warpId) {
                const index = this.warpzonesLayer.objects.findIndex(x => x.id === warpId);
                if (index !== -1) {
                    warpzone.setData('warp', this.warpzones[index]);
                }
                else {
                    console.error(`Warp ${warpId} indicates a wrong node.`);
                    warpzone.setData('warp', null);
                }
            }
        });
        this.obstacles = this.map.createLayer('maptile', this.tileset);
        this.obstacles.setCollisionByProperty({ collides: true });
    }

    setActive(scene: Scene) {
        scene.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        scene.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }

    assignGroup(scene: Scene, group: Phaser.Physics.Arcade.Group) {
        scene.physics.add.collider(group, this.obstacles);
    }
}

