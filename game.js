class Example extends Phaser.Scene
{
 	
    addPlayer(playerInfo) {
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatform);
    }

    addOtherPlayers(playerInfo) {
	var otherPlayer = this.physics.add.sprite(100, 450, 'dude');
        otherPlayer.setBounce(0.2);
        otherPlayer.setCollideWorldBounds(true);
        this.physics.add.collider(otherPlayer, this.platforms);
        this.physics.add.collider(otherPlayer, this.movingPlatform);
        otherPlayer.id = playerInfo.id;
        this.otherPlayers.add(otherPlayer);
    }
    
    preload ()
    {        
        this.load.image('sky', 'assets/sky.png');        
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');        
        this.load.spritesheet('dude', 'assets/dude.png', {frameWidth: 32, frameHeight: 48});
    }

    create ()
    {        
        this.add.image(400, 300, 'sky');
        
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        
        this.movingPlatform = this.physics.add.image(400, 400, 'ground');
        this.movingPlatform.setImmovable(true);
        this.movingPlatform.body.allowGravity = false;
        this.movingPlatform.setVelocityX(50);          
        
        this.player = this.physics.add.sprite(100, 450, 'dude');        
	this.otherPlayers = this.add.group();
	
	this.stars = this.physics.add.group();	
	
        this.socket = io();
        const self = this;
	
	this.socket.on("currentPlayers", function(players) {
	      Object.keys(players).forEach(function(id) {
	      
	        console.log(self.socket.id);
		if (players[id].id === self.socket.id) {
		  self.addPlayer(players[id]);
		} else {
		  self.addOtherPlayers(players[id]);
		}
	      });
	    });
        
        this.socket.on("newPlayer", function(playerInfo) {
	      self.addOtherPlayers(playerInfo);
	    });
        
        
        this.socket.on('playerDisconnect', function (playerId) {
            console.log(self.otherPlayers);
	    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
	      if (playerId === otherPlayer.id) {
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
        
        this.socket.on('placeStars', function(stars) {
	  Object.values(stars).forEach(function(star) {
	    var new_star = self.physics.add.sprite(star.x, star.y, 'star');
	    new_star.id = star.id;
	    self.stars.add(new_star);	    
	    new_star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));	       	    
	  }); 
	  self.physics.add.collider(self.stars, self.platforms);
	  self.physics.add.collider(self.stars, self.movingPlatform);
	});
		       
        this.socket.on('starsMovement', function(starsData) {          
	  starsData.forEach(function(starData) {
	    self.stars.getChildren().forEach(function(star) {
	      if (star.id === starData.id) {
		star.setPosition(starData.x, starData.y);
		star.setVelocityX(starData.velocityX);
	      }
	    });
	  });
	});
	
	this.socket.on('platformMovement', function(platformData) {          
	  self.movingPlatform.setPosition(platformData.x, platformData.y);	        
	});
              
       
        this.socket.on('collectStar', function(id) {
          self.stars.getChildren().forEach(function (star) {
          	if (star.id === id)          	
          	    star.disableBody(true, true);          	
          });          
	});
	
	
	this.physics.add.overlap(this.player, this.stars, (player, star) =>
        {            
            star.disableBody(true, true);
            this.socket.emit('collectStar', star.id);
        });
		
	this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });	
		
        this.cursors = this.input.keyboard.createCursorKeys();
    }  

    update ()
    {
        const { left, right, up } = this.cursors;
        var anim = '';        
        
        if (left.isDown)
        {
            this.player.setVelocityX(-160);
            anim = 'left'
            this.player.anims.play(anim, true);
        }
        else if (right.isDown)
        {
            this.player.setVelocityX(160);
            anim = 'right'
            this.player.anims.play(anim, true);
        }
        else
        {
            this.player.setVelocityX(0);
            anim = 'turn'
            this.player.anims.play(anim);
        }

        if (up.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-330);
        }
        
        if (this.movingPlatform.x >= 500) {
	    this.movingPlatform.setVelocityX(-50);
	}
	else if (this.movingPlatform.x <= 300) {
	    this.movingPlatform.setVelocityX(50);
	}
        
        var x = this.player.x;
	var y = this.player.y;	
	if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
	  this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, anim: anim});
	}
	 	
	this.player.oldPosition = {
	  x: this.player.x,
	  y: this.player.y	  
	};
	
        var starsData = this.getStarsData(this.stars.getChildren());
        this.socket.emit('starsMovement', starsData);
        
        var platformData = this.getPlatformData(this.movingPlatform);
        this.socket.emit('platformMovement', platformData);
    }

   getStarsData(stars) {
	  const starsData = [];
	  stars.forEach(star => {
	    const starData = {
	      x: star.x,
	      y: star.y,
	      id: star.id,
	      velocityX: star.body.velocity.x
	    };
	    starsData.push(starData);
	  });
	  return starsData;
	}
	
   getPlatformData(platform){
   	const platformData = {
   		x: platform.x, 
   		y: platform.y  		  		
   	};
   	return platformData;
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
            debug: false,
            gravity: { y: 300 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
