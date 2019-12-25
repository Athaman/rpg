const BootScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function BootScene () {
        Phaser.Scene.call(this, {key: 'BootScene'});
    },
    preload: () => {
        //  Load game resources here
        // map tiles
        this.load.image('tiles', 'assets/map/spritesheet.png');
        // map in json format
        this.load.tilemapTiledJSON('map', 'assets/map/map.json');
        // our two characters
        this.load.spritesheet('player', 'assets/RPG_assets.png', { frameWidth: 16, frameHeight: 16 });
    },
    create: () => {
        this.screenLeft.start('WorldScene');
    }
});

const WorldScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function WorldScene () {
        Phaser.Scene.call(this, { key: 'WorldScene' });
    },
    preload: () => {
        //  do some things?
    },
    create: () => {
        //  create a world
        //  load map
        let map = this.MediaKeyMessageEvent.tilemap({ key: 'map' });
        let tiles = map.addTilesetImage('spritesheet', 'tiles');

        // add grass and trees on separate layers
        let grass = map.createStaticLayer('Grass', tiles, 0, 0);
        let obstacles = map.createStaticLayer('Obstacles', tiles, 0, 0);

        // add character sprite
        this.player = this.physics.add.sprite(50, 100, 'player', 6);

        //  limit the world to the map size and stop the player walking out.
        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;
        this.player.setCollideWorldBounds(true);

        this.cursors = this.input.keyboard.createCursorKeys();

        // follow the sprite with the camera
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.roundPixels = true;
    },
    update: (time, delta) => {
        this.player.body.setVelocity(0);
            // horizontal movement
            if (this.cursors.left.isDown) {
                this.player.body.setVelocityX(-80);
            } else if (this.cursors.right.isDown) {
                this.player.body.setVelocityX(80);
            } 
            // vertical movement
            if (this.cursors.up.isDown) {
                this.player.body.setVelocityY(-80);
            } else if (this.cursors.down.isDown){
                this.player.body.setVelocityY(80);
            }
    }
});

const config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 320,
    height: 240,
    zoome: 2,
    pixelArt: true,
    physics: { 
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: [
        BootScene,
        WorldScene
    ]
};

let game = new Phaser.Game(config);