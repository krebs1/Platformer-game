const cvs = document.querySelector('.canvas'),
    ctx = cvs.getContext('2d');

let keyConfigObj = {
    'KeyD': {
        'oppositeKey': 'KeyA',
        'action': 'moveRight',
    },
    'KeyA': {
        'oppositeKey': 'KeyD',
        'action': 'moveLeft',
    },
    'Space': {
        'oppositeKey': '',
        'action': 'jump',
    },
};

let mapObj = {
    'mapW': 32,
    'mapH': 8,
    'map': [
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
        "W                              W",
        "W                              W",
        "WW       WWWWWWWWWWWW          W",
        "W                              W",
        "W                              W",
        "W                              W",
        "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    ],
};

let tileSetObj = {
    'tileSize': 16,
    'W': 'green',
    ' ': 'black',
};

class Map{
    constructor(mapObj, tileSetObj, ctx){
        this.mapObj = mapObj;
        this.mapW = this.mapObj.mapW;
        this.mapH = this.mapObj.mapH;
        this.map = this.mapObj.map;
        this.tileSetObj = tileSetObj;
        this.tileSize = this.tileSetObj.tileSize;
        this.ctx = ctx;
    }

    draw(){
        for(let i = 0; i < this.mapH; i++){
            for(let j = 0; j < this.mapW; j++){
                this.ctx.fillStyle = this.tileSetObj[this.map[i][j]];
                this.ctx.fillRect(j*this.tileSize, i*this.tileSize, this.tileSize, this.tileSize);
                this.ctx.strokeRect(j*this.tileSize, i*this.tileSize, this.tileSize, this.tileSize);
            }
        }
    }
}

class KeyController{
    constructor(keyConfigObj) {
        this.keyConfig = keyConfigObj;
        this.pressedKeys = [];
    }

    keyDown(code){ //Add new key
        if(!(code in this.keyConfig)) return 0;

        if(this.pressedKeys.indexOf(code) === -1){
            let oppositeKey = this.keyConfig[code].oppositeKey;
            if(oppositeKey){
                let index = this.pressedKeys.indexOf(oppositeKey);

                if(index === -1){
                    this.pressedKeys.push(code);
                    return 0;
                }

                this.pressedKeys.splice(index, 1);
                this.pressedKeys.push(code);
                return 0;
            }
            this.pressedKeys.push(code);
        }
    }

    keyUp(code){ //Remove key
        if(code in this.keyConfig && this.pressedKeys.indexOf(code) !== -1) this.pressedKeys.splice(this.pressedKeys.indexOf(code), 1);
    }

    keyPressed(code){ //Check if a key is pressed
        return this.pressedKeys.indexOf(code) !== -1;
    }
}

class GameObject{
    constructor(posX, posY, width, height, ctx) {
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
        this.ctx = ctx;
    }

    intersect(gameObject){
        let x1 = this.posX + this.width,
            y1 = this.posY + this.height;
        let x2 = gameObject.posX + gameObject.width,
            y2 = gameObject.posY + gameObject.height;
        console.log(x1, y1, x2, y2);
        return this.posX < x2 || x1 > gameObject.posX || this.posY < y2 || y1 > gameObject.posY;
    }

    draw(color){
        this.ctx.fillStyle = color;
        this.ctx.fillRect(this.posX, this.posY, this.width, this.height);
    }
}

class Coin extends GameObject{

}

class Entity extends GameObject{
    constructor(posX, posY, width, height, speedX, ctx, map) {
        super(posX, posY, width, height, ctx);
        this.speedX = speedX;
        this.dx = 0;
        this.dy = 0;
        this.map = map;
        this.onGround = false;
    }

    collision(axis){
        for(let i = Math.trunc(this.posY / this.map.tileSize); i <= (this.posY + this.height) / this.map.tileSize; i++){
            for(let j = Math.trunc(this.posX / this.map.tileSize); j <= (this.posX + this.width) / this.map.tileSize; j++){
                if(this.map.mapObj['map'][i][j] !== ' '){
                    if(axis === 'X'){
                        if(this.dx > 0) this.posX = j * this.map.tileSize - this.width;
                        if(this.dx < 0) this.posX = (j + 1) * this.map.tileSize;
                    }
                    if(axis === 'Y'){
                        if(this.dy > 0) {
                            this.posY = (i + 1) * this.map.tileSize;
                            this.dy = 0;
                        }
                        if(this.dy < 0) {
                            this.posY = i * this.map.tileSize - this.height;
                            this.dy = 0;
                            this.onGround = true;
                        }
                    }
                }
            }
        }
    }
}

class Enemy extends Entity{
    constructor(posX, posY, width, height, speedX, ctx, map) {
        super(posX, posY, width, height, speedX, ctx, map);
        this.alive = true;
    }
}

class Player extends Entity{
    constructor(posX, posY, width, height, speedX, jumpForce, ctx, map, keyController) {
        super(posX, posY, width, height, speedX, ctx, map);
        this.jumpForce = jumpForce;
        this.keyController = keyController;
    }

    directions(){
        this.dx = 0;
        this.keyController.pressedKeys.forEach(function (item){
            switch (this.keyController.keyConfig[item].action) {
            case 'moveRight':
                this.dx = this.speedX;
                break;
            case 'moveLeft':
                this.dx = -this.speedX;
                break;
            case 'jump':
                if(this.onGround){
                    this.dy = this.jumpForce;
                    this.onGround = false;
                }
                break;
            }
        }.bind(this));
    }

    move(){
        this.posX += this.dx;
        this.collision('X');

        if(!this.onGround){
            this.posY -= this.dy;
            this.dy -= 0.1;
            this.collision('Y');
        }
    }

    update(){
        this.directions();
        this.move();
        this.draw('red');
    }
}

let Resize = (mapH, tileSize) => {
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    ctx.scale(window.innerHeight/(mapH*tileSize), window.innerHeight/(mapH*tileSize));
}

let keyController = new KeyController(keyConfigObj);
let map = new Map(mapObj, tileSetObj, ctx);
let player = new Player(50, 50, 16, 32, 2, 10, ctx, map, keyController);

addEventListener('keydown', function(event){
    keyController.keyDown(event.code);
});
addEventListener('keyup', function(event){
    keyController.keyUp(event.code);
});

let Start = () => {
    Resize(map.mapH, map.tileSize);
    window.addEventListener('resize', () => Resize(map.mapH, map.tileSize));
    setInterval(Update, 1000/60);
}

let Update = () => {
    map.draw();
    player.update();
}

Start();
Update();