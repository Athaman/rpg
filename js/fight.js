const BootScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function BootScene() {
        Phaser.Scene.call(this, { key: 'BootScene' });

    },
    preload: function() {
        this.load.spritesheet('player', 'assets/RPG_assets.png', { frameWidth: 16, frameHeight: 16 });
        this.load.image('dragonblue', 'assets/dragonblue.png');
        this.load.image('dragonorange', 'assets/dragonorange.png');
    },

    create: function() {
        this.scene.start('BattleScene');
    }
});

const BattleScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function BattleScene() {
        Phaser.Scene.call(this, { key: 'BattleScene' });
    },
    create: function() {
        this.cameras.main.setBackgroundColor('rgba(0, 200, 0, 0.5)');

        //  player character - warrior
        let warrior = new PlayerCharacter(this, 250, 50, 'player', 1, 'Warrior', 100, 20);
        this.add.existing(warrior);

        // player character - mage
        let mage = new PlayerCharacter(this, 250, 100, 'player', 4, 'Mage', 80, 8);
        this.add.existing(mage);

        let dragonBlue = new Enemy(this, 50, 50, 'dragonblue', null, 'Dragon', 50, 3);
        this.add.existing(dragonBlue);

        let dragonOrange = new Enemy(this, 50, 100, 'dragonorange', null, 'Dragon2', 50, 3);
        this.add.existing(dragonOrange)

        // player array
        this.heroes = [ warrior, mage ];
        //  mobs array
        this.enemies = [ dragonBlue, dragonOrange ];
        // array with both parties, who will attack;
        this.units = this.heroes.concat(this.enemies);

        //  Run the UI scene at the same time... 
        this.scene.launch('UIScene');
        //  this is a trash way to initialise the index and I'd much rather do it starting at 0
        //  unfortunately due to the way the message function uses a 3 second delay for the damage dealt
        //  you need to start here and increment the index before the function so that you get the right 
        //  player/target combo.
        this.index = -1;
    },
    nextTurn: function() {
        this.index++;
        // restart if out of units
        if (this.index >= this.units.length) this.index = 0;
        if(this.units[this.index] instanceof PlayerCharacter) this.events.emit('PlayerSelect', this.index);
        else {
            const r = Math.floor(Math.random() * this.heroes.length);
            this.units[this.index].attack(this.heroes[r]);
            this.time.addEvent({ delay: 3000, callback: this.nextTurn, callbackScope: this });
        }
    },
    receivePlayerSelection: function(action, target) {
        if(action == 'attack') this.units[this.index].attack(this.enemies[target]);
        this.time.addEvent({ delay: 3000, callback: this.nextTurn, callbackScope: this });
    }
});

const UIScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function UIScene() {
        Phaser.Scene.call(this, { key: 'UIScene' });
    },
    create: function() {
        this.battleScene = this.scene.get('BattleScene');

        this.graphics = this.add.graphics();
        this.graphics.lineStyle(1, 0xffffff);
        this.graphics.fillStyle(0x031f4c, 1);
        this.graphics.strokeRect(2, 150, 90, 100);
        this.graphics.fillRect(2, 150, 90, 100);
        this.graphics.strokeRect(95, 150, 90, 100);
        this.graphics.fillRect(95,150, 90, 100);
        this.graphics.strokeRect(188, 150, 130, 100);
        this.graphics.fillRect(188, 150, 130, 100);

        this.menus = this.add.container();

        this.heroesMenu = new HeroesMenu(195, 153, this);
        this.actionsMenu = new ActionsMenu(100, 153, this);
        this.enemiesMenu = new EnemiesMenu(8, 153, this);

        this.currentMenu = this.actionsMenu;

        this.menus.add(this.heroesMenu);
        this.menus.add(this.actionsMenu);
        this.menus.add(this.enemiesMenu);   

        this.remapHeroes();
        this.remapEnemies();

        this.input.keyboard.on('keydown', this.onKeyInput, this);

        this.battleScene.events.on("PlayerSelect", this.onPlayerSelect, this);
        this.events.on("SelectEnemies", this.onSelectEnemies, this);
        this.events.on("Enemy", this.onEnemy, this);

        this.message = new Message(this, this.battleScene.events);
        this.add.existing(this.message);

        this.battleScene.nextTurn();
    },
    remapHeroes: function() {
        const heroes = this.battleScene.heroes;
        this.heroesMenu.remap(heroes);
    },
    remapEnemies: function() {
        const enemies = this.battleScene.enemies;
        this.enemiesMenu.remap(enemies);
    },
    onKeyInput: function(event) {
        if(!this.currentMenu) return;
        const btn = event.code;
        if(btn === "ArrowUp") this.currentMenu.moveSelectionUp();
        else if(btn === "ArrowDown") this.currentMenu.moveSelectionDown();
        else if(btn === "ArrowRight" || btn === "Shift") console.log('the right button, it does nothing');
        else if(btn === "Space" || btn === "ArrowLeft") this.currentMenu.confirm();
    },
    onPlayerSelect: function(id) {
        console.log('players turn');
        this.heroesMenu.select(id);
        this.actionsMenu.select(0);
        this.currentMenu = this.actionsMenu;
    },
    onSelectEnemies: function() {
        console.log('choose your target');
        this.currentMenu = this.enemiesMenu;
        this.enemiesMenu.select(0);
    },
    onEnemy: function(index) {
        console.log('enemies turn');
        this.heroesMenu.deselect();
        this.actionsMenu.deselect();
        this.enemiesMenu.deselect();
        this.currentMenu = null;
        this.battleScene.receivePlayerSelection('attack', index);
    }
});

const Unit = new Phaser.Class({
    Extends: Phaser.GameObjects.Sprite,
    initialize: function Unit(scene, x, y, texture, frame, type, hp, damage) {
        Phaser.GameObjects.Sprite.call(this, scene, x, y, texture, frame);
        this.type = type;
        this.maxHp = this.hp = hp;
        this.damage = damage; 
    },
    attack: function(target) {
        target. takeDamage(this.damage);
        this.scene.events.emit("Message", this.type + " attacks " + target.type + " for " + this.damage + " damage")
    },
    takeDamage: function(damage) {
        this.hp -= damage;
    }
});

const Enemy = new Phaser.Class({
    Extends: Unit,
    initialize: function Enemy(scene, x, y , texture, frame, type, hp, damage) {
        Unit.call(this, scene, x, y, texture, frame, type, hp, damage);
    }
});

const PlayerCharacter = new Phaser.Class({
    Extends: Unit,
    initialize: function PlayerCharacter(scene, x, y, texture, frame, type, hp, damage) {
        Unit.call(this, scene, x, y, texture, frame, type, hp, damage);
        //  you could use this to set the player on different sides of the fight sometimes.
        this.flipX = true; 

        this.setScale(2);
    }
});

const MenuItem = new Phaser.Class({
    Extends: Phaser.GameObjects.Text,
    initialize: function MenuItem(x, y, text, scene){
        Phaser.GameObjects.Text.call(this, scene, x, y, text, { color: '#ffffff', align: 'left', fontSize: 15 }); 
    },
    select: function() {
        this.setColor('#f8ff38');
    },
    deselect: function() {
        this.setColor('#ffffff');
    }
});

const Menu = new Phaser.Class({ 
    Extends: Phaser.GameObjects.Container,
    initialize: function Menu(x, y, scene, heroes) {
        Phaser.GameObjects.Container.call(this, scene, x, y);
        this.menuItems = [];
        this.menuItemIndex = 0;
        this.heroes = heroes;
        this.x = x;
        this.y = y;
    },
    addMenuItem: function(unit) {
        let menuItem = new MenuItem(0, this.menuItems.length * 20, unit, this.scene);
        this.menuItems.push(menuItem);
        this.add(menuItem);
    },
    moveSelectionUp: function() {
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex--;
        if(this.menuItemIndex < 0) this.menuItemIndex = this.menuItems.length - 1;
        this.menuItems[this.menuItemIndex].select();
    },
    moveSelectionDown: function() {
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex++;
        if(this.menuItemIndex >= this.menuItems.length) this.menuItemIndex = 0;
        this.menuItems[this.menuItemIndex].select();
    },
    select: function(index) {
        if(!index) index = 0;
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex = index;
        this.menuItems[this.menuItemIndex].select();
    },
    deselect: function() {
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex = 0;
    },
    confirm: function() {
        // when the player has confirmed do the thing
    },
    clear: function() {
        for(let i = 0; i < this.menuItems.length; i++) {
            this.menuItems[i].destroy();
        }
        this.menuItems.length = 0;
        this.menuItemIndex = 0;
    },
    remap: function(units) {
        this.clear();
        for(let i = 0; i < units.length; i++) {
            this.addMenuItem(units[i].type);
        }
    }
});

const HeroesMenu = new Phaser.Class({
    Extends: Menu,
    initialize: function HeroesMenu(x, y, scene) {
        Menu.call(this, x, y, scene);
    }
});

const ActionsMenu = new Phaser.Class({
    Extends: Menu,
    initialize: function ActionsMenu(x, y, scene) {
        Menu.call(this, x, y, scene);
        this.addMenuItem('Attack');
    },
    confirm: function() {
        this.scene.events.emit('SelectEnemies');
    }
});

const EnemiesMenu = new Phaser.Class({
    Extends: Menu,
    initialize: function EnemiesMenu(x, y, scene) {
        Menu.call(this, x, y, scene);
    },
    confirm: function() {
        this.scene.events.emit("Enemy", this.menuItemIndex);
    }
});

const Message = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,
    initialize: function Message(scene, events) {
        Phaser.GameObjects.Container.call(this, scene, 160, 30);
        let graphics = this.scene.add.graphics();
        this.add(graphics);
        graphics.lineStyle(1, 0xffffff, 0.8);
        graphics.fillStyle(0x031f4c, 0.3);
        graphics.strokeRect(-90, -15, 180, 30);
        graphics.fillRect(-90, -15, 180, 30);
        this.text = new Phaser.GameObjects.Text(scene, 0, 0, "", { color: '#ffffff', align: 'center', fontSize: 13, wordWrap: { width: 160, useAdvancedWrap: true }});
        this.add(this.text);
        this.text.setOrigin(0.5);
        events.on("Message", this.showMessage, this);
        this.visible = false;
    },
    showMessage: function(text) {
        this.text.setText(text);
        this.visible = true;
        if(this.hideEvent) this.hideEvent.remove(false);
        this.hideEvent = this.scene.time.addEvent({ delay: 2000, callback: this.hideMessage, callbackScope: this });
    },
    hideMessage: function() {
        this.hideEvent = null;
        this.visible = false;
    }
});

const config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 320,
    height: 240,
    zoom: 2,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: [ BootScene, BattleScene, UIScene ]
};

let game = new Phaser.Game(config);