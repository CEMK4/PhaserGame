class Example extends Phaser.Scene {
    movingPlatform;
    cursors;
    platforms;
    stars;
    player;

    addPlayer(playerInfo) {
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatform);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.stars, this.movingPlatform);
    }

    addOtherPlayers(playerInfo) {
        var player = this.physics.add.sprite(100, 450, 'dude');
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatform);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.stars, this.movingPlatform);
        player.id = playerInfo.id;
        this.otherPlayers.add(player);
    }

    playerMoved(data) {
        console.log(this.otherPlayers[data.id]);
        if (this.otherPlayers[data.id]) {
            this.otherPlayers[data.id].setPosition(data.x, data.y);
        }
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        this.add.image(400, 300, 'sky');

        this.platforms = this.physics.add.staticGroup();

        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();

        this.movingPlatform = this.physics.add.image(400, 400, 'ground');

        this.movingPlatform.setImmovable(true);
        this.movingPlatform.body.allowGravity = false;
        this.movingPlatform.setVelocityX(50);

        this.player = this.physics.add.sprite(100, 450, 'dude');

        var self = this;
        this.socket = io();
        this.otherPlayers = this.physics.add.group();

        this.socket.on('currentPlayers', function (players) {
          Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
              addPlayer(self, players[id]);
            } else {
              addOtherPlayers(self, players[id]);
            }
          });
        });

        this.socket.on('newPlayer', function (playerInfo) {
          addOtherPlayers(self, playerInfo);
        });

        this.socket.on('disconnect', function (playerId) {
          self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerId === otherPlayer.playerId) {
              otherPlayer.destroy();
            }
          });
        });

        this.socket.on('playerMoved', function (data) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (data.player.id === otherPlayer.id) {
                    if (data.anim === 'turn')
                        otherPlayer.anims.play(data.anim)
                    else otherPlayer.anims.play(data.anim, true)
                    otherPlayer.setPosition(data.player.x, data.player.y);
                }
            });
        });

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        for (const star of this.stars.getChildren()) {
            star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        }       

        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    }

    update() {
        const { left, right, up } = this.cursors;

        if (left.isDown) {
            this.player.setVelocityX(-160);

            this.player.anims.play('left', true);
        }
        else if (right.isDown) {
            this.player.setVelocityX(160);

            this.player.anims.play('right', true);
        }
        else {
            this.player.setVelocityX(0);

            this.player.anims.play('turn');
        }

        if (up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }

        if (this.movingPlatform.x >= 500) {
            this.movingPlatform.setVelocityX(-50);
        }
        else if (this.movingPlatform.x <= 300) {
            this.movingPlatform.setVelocityX(50);
        }
    }

    collectStar(player, star) {
        star.disableBody(true, true);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
