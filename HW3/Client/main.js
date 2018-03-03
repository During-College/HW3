
var socket = io.connect("http://24.16.255.56:8888");

window.onload = function () {

    var saveButton = document.getElementById("save");
    var loadButton = document.getElementById("load");

    saveButton.onclick = function() {
        saveData();
    }

    loadButton.onclick = function() {
        loadData();
    }
        
    function saveData() {
        console.log("Saving");
        
        var objectsList = [];
        for (var i = 0; i < game.entities.length; i++) {
            var ent = game.entities[i];
            objectsList.push({
                            radius: ent.radius,
                            colors: ent.colors,
                            color: ent.color,
                            x: ent.x,
                            y: ent.y,
                            velocity: ent.velocity
                            });
        }
        var mouseInfo = {mouseDown: game.mouseDown, mouseX: game.mouseX, mouseY: game.mouseY};
        
        socket.emit("save", {studentname: "Matthew Hwang", statename: "aState", data: {objects: objectsList, mouse: mouseInfo}});
        console.log("Saved");
    }
        
    function loadData() {
        console.log("Loading");
        socket.emit("load", { studentname: "Matthew Hwang", statename: "aState" });    
        console.log("Loaded");
    }
        
    socket.on("load", function (data) {
        game.mouseDown = data.data.mouse.mouseDown;
        game.mouseX = data.data.mouse.mouseX;
        game.mouseY = data.data.mouse.mouseY;
        
        game.entities = [];
        
        for (var i = 0; i < data.data.objects.length; i++) {
            var object = data.data.objects[i];
            
            var circle = new Circle(game);
            circle.radius = object.radius;
            circle.colors = object.colors;
            circle.color = object.color;
            circle.x = object.x;
            circle.y = object.y;
            circle.velocity = object.velocity;
            game.addEntity(circle);            
        }
    });

};

function distance(a, b) {
    var difX = a.x - b.x;
    var difY = a.y - b.y;
    return Math.sqrt(difX * difX + difY * difY);
};

function Circle(game) {
    this.radius = randomInt(30) + 5;
    this.colors = ["Red", "Green", "Blue", "White", "Purple", "Yellow", "Aqua"];
    this.color = 3;
    Entity.call(this, game, this.radius + Math.random() * (800 - this.radius * 2), this.radius + Math.random() * (400 - this.radius * 2));
    this.velocity = { x: 0, y: 0 };
}

Circle.prototype = new Entity();
Circle.prototype.constructor = Circle;

Circle.prototype.collideRight = function () {
    return this.x + this.radius > 800;
};
Circle.prototype.collideLeft = function () {
    return this.x - this.radius < 0;
};
Circle.prototype.collideBottom = function () {
    return this.y + this.radius > 600;
};
Circle.prototype.collideTop = function () {
    return this.y - this.radius < 0;
};

Circle.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

function explode(entity) {
    var oldX = entity.x;
    var oldY = entity.y;
    entity.radius *= 0.7;
    entity.velocity.x = randomInt(41) - 20;
    entity.velocity.y = randomInt(41) - 20;

    var clone = new Circle(entity.game);
    clone.radius = entity.radius;
    clone.velocity.x = entity.velocity.x * -1;
    clone.velocity.y = entity.velocity.y * -1;
    clone.x = oldX + clone.velocity.x;
    clone.y = oldY + clone.velocity.y;
    clone.color = entity.color;
    entity.game.addEntity(clone);
}

Circle.prototype.update = function () {
    Entity.prototype.update.call(this);

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x * 0.5;
        if (this.collideLeft()) {
            this.x = this.radius;
        }
        if (this.collideRight()) {
            this.x = 800 - this.radius;
        }
    }
    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y * 0.5;
        if (this.collideTop()) {
            this.y = this.radius;
        }
        if (this.collideBottom()) {
            this.y = 600 - this.radius;
        }
    }
    
    var thisIndex = 0;
    for (var i = 0; i < this.game.entities.length; i++) {
        if (this == this.game.entities[i]) {
            thisIndex = i;
        }
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (this != ent && this.collide(ent)) {
            var minRadius = 5;
            if (this.radius > minRadius) {
                explode(this);
                if (ent.radius > minRadius) {
                    explode(ent);
                }
            } else {
                var temp = { x: this.velocity.x, y: this.velocity.y };

                var dist = distance(this, ent);
                var delta = this.radius + ent.radius - dist;
                var difX = (this.x - ent.x)/dist;
                var difY = (this.y - ent.y)/dist;

                this.x += difX * delta / 2;
                this.y += difY * delta / 2;
                ent.x -= difX * delta / 2;
                ent.y -= difY * delta / 2;
            }
        };
    };
    if (this.game.mouseDown) {
        if (this.x < this.game.mouseX) {
            this.velocity.x+=5;
        } else if (this.x > this.game.mouseX) {
            this.velocity.x-=5;
        }
        
        if (this.y < this.game.mouseY) {
            this.velocity.y+=5;
        } else if (this.y > this.game.mouseY) {
            this.velocity.y-=5;
        }
    } else {
        if (this.game.mouse != null && distance(this, this.game.mouse) < 200) {
            if (this.x < this.game.mouseX) {
                this.velocity.x-=5;
            } else if (this.x > this.game.mouseX) {
                this.velocity.x+=5;
            }
            
            if (this.y < this.game.mouseY) {
                this.velocity.y-=20;
            } else if (this.y > this.game.mouseY) {
                this.velocity.y+=20;
            }
        }
    }
}

Circle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.colors[this.color];
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
}

function randomInt(maxValue) {
    return Math.floor(Math.random() * Math.floor(maxValue));
}

// the "main" code begins here

var ASSET_MANAGER = new AssetManager();
var game = null;

ASSET_MANAGER.queueDownload("./img/Background.png");

ASSET_MANAGER.downloadAll(function () {
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
    game = gameEngine;
    for (var i = 0; i < 100; i++) {
        var circle = new Circle(gameEngine);
        circle.color = randomInt(7);
        circle.velocity.x = randomInt(41) - 20;
        circle.velocity.y = randomInt(41) - 20;
        gameEngine.addEntity(circle);
    }
    
    var collisionFound = true;
    while (collisionFound) {
        var collisionCheck = false;
        
        for (var i = 0; i < gameEngine.entities.length; i++) {
            var ent = gameEngine.entities[i];
            for (var j = 0; j < gameEngine.entities.length; j++) {
                var ent2 = gameEngine.entities[j];
                if (ent != ent2 && ent.collide(ent2)) {
                    collisionCheck = true;
                    ent.radius = randomInt(30) + 5;
                    ent.x = ent.radius + Math.random() * (800 - ent.radius * 2);
                    ent.y = ent.radius + Math.random() * (600 - ent.radius * 2);
                    ent2.radius = randomInt(30) + 5;
                    ent2.x = ent2.radius + Math.random() * (800 - ent2.radius * 2);
                    ent2.y = ent2.radius + Math.random() * (600 - ent2.radius * 2);
                }
            }
        }
        if (!collisionCheck) {
            collisionFound = false;
        }
    }

    gameEngine.init(ctx);
    gameEngine.start();
});
