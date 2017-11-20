var canvas = document.getElementById('game');
var ctx = canvas.getContext("2d");
var glob = 1;
var gl = "canUpdate";
const {sqrt, max, min, pow, sin, cos} = Math;

class mapManager {

    constructor() {
        this.mapData = null;
        this.tLayer = null;
        this.xCount = 0;
        this.yCount = 0;
        this.tSize = {x: 32, y: 32};
        this.mapSize = {x: 32, y: 32};
        this.tilesets = [];
        this.imgLoadCount = 0;
        this.jsonLoaded = 0;
        this.imgLoaded = 0;
        this.view = {x: 0, y: 0, w: 1200, h: 720};
    }

    loadMap(path) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status === 200) {
                console.log(request.responseText);
                this.parseMap(request.responseText);


            }
        };
        request.open("GET", path, true);
        request.send();
    }

    parseMap(tilesJSON) {
        this.mapData = JSON.parse(tilesJSON);
        console.log("Mapdata after: " + this.mapData);
        this.xCount = this.mapData.width;  //150 -> count of block by X
        this.yCount = this.mapData.height; //25 -> by Y
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        // MAP SIZE => COUNT OF BLOCKS * SIZE OF ONE BLOCK
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.yCount * this.tSize.y;
        for (let i = 0; i < this.mapData.tilesets.length; i++) {
            var img = new Image();
            img.onload = () => {
                this.imgLoadCount++;
                if (this.imgLoadCount.toString() === this.mapData.tilesets.length.toString()) {
                    this.imgLoaded = 1;
                }

            };
            img.src = this.mapData.tilesets[i].image;

            let t = this.mapData.tilesets[i];
            console.log(" this.mapData.tilesets[i] : " + t);
            let ts = {
                firstgid: t.firstgid,
                image: img,
                name: t.name,
                xCount: Math.floor(t.imagewidth / this.tSize.x),
                yCount: Math.floor(t.imageheight / this.tSize.y)
            };
            this.tilesets.push(ts);
        }
        this.jsonLoaded = 1;
    }

    draw(ctx) {
        setTimeout(() => {
        }, 1000);
        if (this.imgLoaded === 0 || this.jsonLoaded === 0) {
            setTimeout(() => {
                this.draw(ctx)
            }, 100);
        } else {
            if (this.tLayer === null)
                console.log("LAYERS : " + this.tLayer);
            for (let id = 0; id < this.mapData.layers.length; id++) {
                let layer = this.mapData.layers[id];
                if (layer.type === "tilelayer") {
                    this.tLayer = layer;
                    // break;
                    for (let i = 0; i < this.tLayer.data.length; i++) {
                        if (this.tLayer.data[i] !== 0) {
                            let tile = this.getTile(this.tLayer.data[i]);

                            let pX = (i % this.xCount ) * this.tSize.x;
                            let pY = Math.floor(i / this.xCount) * this.tSize.y;

                            if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y))
                                continue;
                            pX -= this.view.x;
                            pY -= this.view.y;

                            ctx.drawImage(tile.img, tile.px, tile.py, this.tSize.x, this.tSize.y, pX, pY, this.tSize.x, this.tSize.y);

                        }
                    }
                }
            }

        }
    }

    isVisible(x, y, width, height) {
        if (x + width < this.view.x || y + height < this.view.y || x > this.view.x + this.view.w || y > this.view.y > this.view.y + this.view.h)
            return false;
        return true;
    }

    getTile(tileIndex) {
        let tile = {
            img: null,
            px: 0, py: 0,
        };
        let tileset = this.getTileset(tileIndex);
        tile.img = tileset.image;
        let id = tileIndex - tileset.firstgid;
        let x = id % tileset.xCount;
        let y = Math.floor(id / tileset.xCount);
        tile.px = x * this.tSize.x;
        tile.py = y * this.tSize.y;
        return tile;
    }

    getTileset(tileIndex) {
        for (let i = this.tilesets.length - 1; i >= 0; i--)
            if (this.tilesets[i].firstgid <= tileIndex) {
                return this.tilesets[i];
            }
        return null;
    }

    parseEntities() {

        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(() => {
                this.parseEntities();
            }, 100);
        } else {
            for (let i = 0; i < this.mapData.layers.length; i++) {
                if (this.mapData.layers[i].type === 'objectgroup') {
                    let entities = this.mapData.layers[i];
                    for (let i = 0; i < entities.objects.length; i++) {
                        let e = entities.objects[i];
                        try {
                            let obj = Object.create(zgameManager.factory[e.type]);
                            obj.name = e.name;
                            obj.pos_x = e.x;
                            obj.pos_y = e.y;
                            obj.size_x = e.width;
                            obj.size_y = e.height;

                            // alert("name"+obj.name);
                            zgameManager.entities.push(obj);
                            if (obj.name === "player") zgameManager.initPlayer(obj);
                        } catch (ex) {
                            alert("Error while creating [" + e.gid + "]" + e.type + ", " + ex);
                        }
                    }
                }
            }
        }
    }

    getTilesetIdx(x, y) {
        let wX = x;
        let wY = y;
        let idx = Math.floor(wY / this.tSize.y) * this.xCount + Math.floor(wX / this.tSize.x);
        return this.tLayer.data[idx];
    }


    centerAt(x, y) {
        if (x < this.view.w / 2) {
            this.view.x = 0;
        } else {
            if (x > this.mapSize.x - this.view.w / 2) {
                this.view.x = this.mapSize.x - this.view.w;
            }
            else {
                this.view.x = x - (this.view.w / 2);
            }
        }
        if (y < this.view.h / 2) {
            this.view.y = 0;
        } else {
            if (y > this.mapSize.y - this.view.h / 2)
                this.view.y = this.mapSize.y - this.view.h;
            else
                this.view.y = y - (this.view.h / 2);
        }

        return {x: this.view.x, y: this.view.y};
    }
}

class Entity {
    constructor() {
        this.pos_x = 0;
        this.pos_y = 0;
        this.size_x = 0;
        this.size_y = 0;

    }
}

//TODO add animation for player
class Player extends Entity {
    constructor() {
        super();
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 5;
        this.fire_delay = true;
        this.owner = null;
    }

    draw(ctx) {
        zpriteManager.drawSprite(ctx, "sprite265", this.pos_x, this.pos_y);
    }

    update(obj) {
        zphysicManager.update(obj);
    }

    onTouchEntity(entity) {
        //for collecting bullets and ening level
    }

    kill() {
        zgameManager.reloadScene();
    }

    fire() {
        if (this.fire_delay) {
            let r = new Rocket();
            r.size_x = 10;
            r.size_y = 8;
            r.name = "bullet_" + (++zgameManager.fireNum);
            let xy1 = zapManager.centerAt(zgameManager.player.pos_x, zgameManager.player.pos_y);
            let Vx = zeventManager.mouse[0] + xy1.x + 10 - zgameManager.player.pos_x - zgameManager.player.size_x / 2;
            let Vy = zeventManager.mouse[1] + xy1.y + 8 - zgameManager.player.pos_y - zgameManager.player.size_y / 2;

            if (Vx || Vy) {
                r.angle = Math.atan2(Vy, Vx);
            } else {
                r.angle = 0;
            }

            if (r.angle < 0) {
                r.angle += 2 * Math.PI;
            }
            // console.log("PLAYER POS +=: " + zgameManager.player.pos_x + " " + zgameManager.player.pos_y);
            // console.log("mouse POS +=: " + zeventManager.mouse[0] + " " + zeventManager.mouse[1]);
            // console.log(r.angle);
            let startXY = this.getBulletStartPos(r.angle);
            r.pos_x = startXY.x;
            r.pos_y = startXY.y;
            r.owner = this;
            zgameManager.entities.push(r);
            zaudioManager.play('shot.mp3');
            this.fire_delay = false;
            setTimeout(() => {
                this.fire_delay = true;
            }, r.delay);
        }
    }


    getBulletStartPos(angle) {
        let StartXPos = (zgameManager.player.pos_x ) + Math.cos(angle) * 40;
        let StartYPos = (zgameManager.player.pos_y ) + Math.sin(angle) * 40;


        return {
            x: StartXPos,
            y: StartYPos
        }
    }

}

class Zombie extends Entity {
    constructor() {
        super();
        this.lifetime = 120;
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 1;
        this.angle = 0;

        this.fire_delay = true;
        this.real_fire_delay = true;
        this.fake_fire_delay = true;

        this.canIwalk = false;
    }

    draw(ctx) {
        zpriteManager.drawSprite(ctx, "sprite264", this.pos_x, this.pos_y);
    }

    update(obj) {
        this.check(obj);
        zphysicManager.update(obj);
    }

    onTouchEntity(obj) {
        // this.kill();
    }

    kill() {

        for (let i = 0; i < zgameManager.entities.length; i++) {
            let e = zgameManager.entities[i];
            if (e.name === this.name) {
                //  console.log("| name of fly | " + e.name + "pos x : " + e.pos_x + " pos .y: " + e.pos_y);
                zgameManager.entities.splice(i, 1);
            }
        }
    }

    fire() {
        if (this.real_fire_delay) {
            let r = new Rocket();
            r.size_x = 5;
            r.size_y = 5;
            r.owner = this.name;
            r.name = "bullet_" + (++zgameManager.fireNum);
            let Vx = this.pos_x + this.size_x / 2 - zgameManager.player.pos_x - zgameManager.player.size_x / 2;
            let Vy = this.pos_y + this.size_y / 2 - zgameManager.player.pos_y - zgameManager.player.size_y / 2;

            if (Vx || Vy) {
                r.angle = Math.atan2(Vy, Vx);
            } else {
                r.angle = 0;
            }
            if (r.angle < 0) {
                r.angle += 2 * Math.PI;
            }
            let startXY = this.getBulletStartPos2(r.angle, this);
            r.pos_x = startXY.x;
            r.pos_y = startXY.y;
            r.owner = this;
            zgameManager.entities.push(r);
            this.real_fire_delay = false;
            setTimeout(() => {
                this.real_fire_delay = true;
            }, r.delay);
        }

    }

    getBulletStartPos2(angle, obj) {
        let StartXPos = (obj.pos_x ) - cos(angle) * 20;
        let StartYPos = (obj.pos_y ) - sin(angle) * 20;

        return {
            x: StartXPos,
            y: StartYPos
        }
    }

    fire_test() {
        if (this.fire_delay) {
            let r = new FakeBullet();
            r.size_x = 2;
            r.size_y = 2;
            r.owner = this.name;
            r.name = "rocket_spe_" + (++zgameManager.fireNum);
            let Vx = this.pos_x + this.size_x / 2 - zgameManager.player.pos_x - zgameManager.player.size_x / 2;
            let Vy = this.pos_y + this.size_y / 2 - zgameManager.player.pos_y - zgameManager.player.size_y / 2;

            if (Vx || Vy) {
                r.angle = Math.atan2(Vy, Vx);
            } else {
                r.angle = 0;
            }

            if (r.angle < 0) {
                r.angle += 2 * Math.PI;
            }

            let startXY = this.getBulletStartPos(r.angle, this);
            r.pos_x = startXY.x;
            r.pos_y = startXY.y;

            zgameManager.entities.push(r);
            r.owner = this;
            this.fire_delay = false;
            setTimeout(() => {
                this.fire_delay = true;
            }, r.delay);
        }
    }

    getBulletStartPos(angle, obj) {
        let StartXPos = (obj.pos_x ) - cos(angle);
        let StartYPos = (obj.pos_y ) - sin(angle);

        return {
            x: StartXPos,
            y: StartYPos
        }
    }


    check(obj) {

        let angle = 0;
        let Vx = obj.pos_x - zgameManager.player.pos_x + zgameManager.player.size_x / 2;
        let Vy = obj.pos_y - zgameManager.player.pos_y + zgameManager.player.size_y / 2;

        if (Vx || Vy) {
            angle = Math.atan2(Vy, Vx);
        } else {
            angle = 0;
        }

        if (angle < 0) {
            angle += 2 * Math.PI;
        }
        // console.log("angle " + angle);

        let nextPosX_front, nextPosY_front;
        let nextPosX_back, nextPosY_back;

        nextPosX_front = obj.pos_x + obj.size_x / 2 + cos(angle);
        nextPosY_front = obj.pos_y + obj.size_y / 2 + sin(angle);
        nextPosX_back = obj.pos_x + cos(angle);
        nextPosY_back = obj.pos_y + sin(angle);


        let ts = zapManager.getTilesetIdx(nextPosX_front, nextPosY_front);
        let ts_back = zapManager.getTilesetIdx(nextPosX_back, nextPosY_back);
        //   console.log("DIS " + obj.name + " dis = " + this.distance(obj.pos_x, zgameManager.player.pos_x, obj.pos_y, zgameManager.player.pos_y));
        //   console.log("PP   " + zgameManager.player.pos_x + " " + zgameManager.player.pos_y);
        //   console.log("TS " + obj.name + " " + zapManager.getTilesetIdx(obj.pos_x, obj.pos_y));
        if (ts_back === 4 || ts === 4) {
            if (this.distance(obj.pos_x, zgameManager.player.pos_x, obj.pos_y, zgameManager.player.pos_y) < 200) {
                if (this.checkForBarriers(obj)) {
                    // console.log(obj);
                    if (obj.canIwalk === true) {
                        //alert();
                        obj.fire();
                        obj.pos_x -= cos(angle) * 2;
                        obj.pos_y -= sin(angle) * 2;
                    }
                }

            }
        } else if (ts_back !== 4 || ts !== 4) {
            obj.pos_x += cos(angle) * obj.size_x;
            obj.pos_y += sin(angle) * obj.size_y;
        }
    }

    checkForBarriers(obj) {
        obj.fire_test();
        return true;
    }

    distance(x1, x2, y1, y2) {
        return sqrt((pow(x2 - x1, 2) + pow(y2 - y1, 2)));
    }
}

class FakeBullet extends Entity {
    constructor() {
        super();
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 90;
        this.owner = null;
        this.delay = 111;

    }

    draw(ctx) {
         //zpriteManager.drawSprite(ctx, "sprite465", this.pos_x, this.pos_y);
    }

    update() {
        zphysicManager.update(this);
    }

    onTouchEntity(obj) {
        // console.log("jk "+ obj.name);
        // if (obj.name.includes('rocket_spe_')) {
        //     obj.kill();
        //     this.kill();
        // }
        if (obj.name.includes('player')) {
            let entity = this.owner;
            if (entity !== null) entity.canIwalk = true;
            this.kill();
        }
    }

    onTouchMap(idx) {
        let entity = this.owner;
        if (entity !== null) entity.canIwalk = false;
        this.kill();
    }

    kill() {
        for (let i = 0; i < zgameManager.entities.length; i++) {
            let e = zgameManager.entities[i];
            if (e.name === this.name) {
                zgameManager.entities.splice(i, 1);
            }
        }
    }
}

class Rocket extends Entity {
    constructor() {
        super();
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 90;
        this.owner = null;
        this.delay = 250;

    }

    draw(ctx) {
        zpriteManager.drawSprite(ctx, "sprite467", this.pos_x, this.pos_y);
    }

    update() {
        let newX, newY;
        newX = this.pos_x;
        newY = this.pos_y;
        //alert(obj.owner.name);
        if (this.owner.name === "player") {
            newX += Math.cos(this.angle) * 12;
            newY += Math.sin(this.angle) * 12;
        } else {
            newX -= Math.cos(this.angle) * 27;
            newY -= Math.sin(this.angle) * 27;
        }
        let e = zphysicManager.entityAtXY(this, newX, newY);
        console.log("Object with: " + e);
        let ts = zapManager.getTilesetIdx(newX + this.size_x, newY + this.size_y);
        let ts_back = zapManager.getTilesetIdx(newX, newY);
        if (e !== null && this.onTouchEntity) {
            if (!e.name.includes('rocket_spe_')) this.onTouchEntity(e);
        }
        if (ts_back !== 4 || ts !== 4 && this.onTouchMap) this.onTouchMap(ts);
        // console.log(ts + ' ' + obj.name);
        if (ts === 4 && ts_back === 4 && e === null) {
            this.pos_x = newX;
            this.pos_y = newY;
        }
        zphysicManager.update(this);
    }

    onTouchEntity(obj) {
        /*костыль*/
        // if(obj.name.match(/zombie_[\d*]/) && this.owner.name === "player" && zgameManager.enemiesCount() === 0)
        //     zgameManager.levelCompleted();
        /*костыль - end*/
        if (obj.name.match(/zombie_[\d*]/)&& this.owner.name === "player") {
                obj.kill();
        }
        if (obj.name.match(/player/)&& this.owner.name.match(/zombie_[\d*]/)) {
            obj.kill();
        }
        if (obj.name.match(/zombie_[\d*]/) && this.owner.name === "player") {
            zaudioManager.play('death.mp3');
            zscoreManager.enemyKilled();
        }
        this.kill();
    }

    onTouchMap(idx) {
        this.kill();
    }

    kill() {
        //console.log("KILLED rocket!");
        for (let i = 0; i < zgameManager.entities.length; i++) {
            let e = zgameManager.entities[i];
            if (e.name === this.name) {
                //console.log("| name of fly | " + e.name + "pos x : " + e.pos_x + " pos .y: " + e.pos_y);
                zgameManager.entities.splice(i, 1);
            }
        }
    }

}

class Bonus extends Entity {
    constructor(lifetime) {
        super();
    }

    draw() {
        zpriteManager.drawSprite(ctx, "Walk (1)", this.pos_x, this.pos_y);
    }

    kill() {

    }

}


class spriteManager {
    constructor() {
        this.image = new Image();
        this.sprites = [];
        this.imgLoaded = false;
        this.jsonLoaded = false;
    }

    loadAtlas(atlasJson, atlasImg) {
        //  console.log("load atlas: atlasJson " + atlasJson);
        // console.log("load atlas: atlaIMG " + atlasImg);
        let request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status === 200) {
                // console.log(request.responseText);
                this.parseAtlas(request.responseText);
            }
        };
        request.open("GET", atlasJson, true);
        request.send();
        this.loadImg(atlasImg);
    }

    loadImg(imgName) {
        this.image.onload = () => {
            this.imgLoaded = true;
            console.log("Atlas img loaded ?  " + this.imgLoaded);
        };
        this.image.src = imgName;
    }

    parseAtlas(atlasJSON) {
        let atlas = JSON.parse(atlasJSON);
        for (let name in atlas.frames) {
            let frame = atlas.frames[name].frame;
            // console.log("parseAtlas _> frame: ", frame);
            this.sprites.push({name: name, x: frame.x, y: frame.y, w: frame.w, h: frame.h});
        }
        this.jsonLoaded = true;
    }

    drawSprite(ctx, name, x, y) {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(() => {
                this.drawSprite(ctx, name, x, y)
            }, 30);
        } else {
            let sprite = this.getSprite(name);
            if (!zapManager.isVisible(x, y, sprite.w, sprite.h)) return;
            x -= zapManager.view.x;
            y -= zapManager.view.y;

            if (name === "sprite265") {
                let dx = zeventManager.mouse[0] - x;
                let dy = zeventManager.mouse[1] - y;
                let rot = Math.atan2(dy, dx);
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rot);
                ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h, -17, -9, sprite.w, sprite.h);
                ctx.restore();
            } else {
                // ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);

                let xy1 = zapManager.centerAt(zgameManager.player.pos_x, zgameManager.player.pos_y);

                let dx = zgameManager.player.pos_x - xy1.x + zgameManager.player.size_x / 2 - x;
                let dy = zgameManager.player.pos_y - xy1.y + zgameManager.player.size_y / 2 - y;
                let rot = Math.atan2(dy, dx);
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rot);
                ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h, -17, -9, sprite.w, sprite.h);
                ctx.restore();
            }
        }
    }

    getSprite(name) {
        for (let i = 0; i < this.sprites.length; i++) {
            let s = this.sprites[i];
            if (s.name === name) return s;
        }
        return null;
    }
}

class scoreManager {
    constructor() {

        this.storage  =[];
        this.clearAll();
        this.load();
        // this.killed = 0;
        // this.score = 0;
        this.currentLevel = 1;
    }

    clearCurrentRecords() {
        // this.killed = 0;
        // this.score = 0;
        this.storage[this.currentLevel-1].score = 0;
        this.storage[this.currentLevel-1].killed = 0;
        this.storage[this.currentLevel-1].name = " - ";

    }

    enemyKilled() {
       // this.killed++;
        this.storage[this.currentLevel-1].killed++;
        this.storage[this.currentLevel-1].score+=100;
       // this.score += 100;
    }

    currentScore() {
        return this.storage[this.currentLevel-1].score;
    }

    currentKills() {
        return this.storage[this.currentLevel-1].killed;
    }

    calculateTotal() {
        this.storage[this.currentLevel-1].total = this.storage[this.currentLevel-1].score;
    }

    getCurrentTotalScore() {
        return this.storage[this.currentLevel-1].total;
    }

    clearAll() {
        this.storage = [];

        for(let i = 0; i < 2; i++) {
            this.storage[i] = {};
            this.storage[i].score = 0;
            this.storage[i].killed = 0;
            this.storage[i].total = 0;
            this.storage[i].name = " - ";

        }

        this.currentLevel = 1;
    }

    save() {
        if(storageAvailable('localStorage')) {
            console.log(`Saving!`);
            localStorage.setItem('score_data', JSON.stringify(this.storage));
           // localStorage.setItem('current_level', this.currentLevel);
        } else {
            console.log(`Local storage is unsupported!`);
        }
    }

    load() {
        if(storageAvailable('localStorage')) {
            console.log(`Loading!`);
            let scoreData = localStorage.getItem('score_data');
            //let currentLevel = localStorage.getItem('current_level');

            if(scoreData !== null /*&& currentLevel !== null*/) {
                console.log(`Found saves!`);
                this.storage = JSON.parse(scoreData);
               // this.currentLevel = currentLevel * 1;
            } else {
                console.log(`Saves not found!`);
            }
        } else {
            console.log(`Local storage is unsupported!`);
        }
    }

    clearSaves() {
        if(storageAvailable('localStorage')) {
            localStorage.removeItem('score_data');
            localStorage.removeItem('current_level');
            localStorage.removeItem('name');
        } else {
            console.log(`Local storage is unsupported!`);
        }
    }

}

class scenesManager {
    constructor() {
    }

    drawLoadingScene() {
        zgameManager.clearScreen();
        ctx.font = "56px Impact, Charcoal, sans-serif";
        ctx.fillStyle = "#a1a2a4";
        ctx.fillText("Loading...", 500, 350);
    }

    drawCurrentLevelScene(currentLevel) {
        ctx.font = "46px Impact, Charcoal, sans-serif";

        if (currentLevel === 1) {
            ctx.fillStyle = "#0077a4";
            ctx.fillText("Level - " + currentLevel + ". Find blue room to finish this level", 200, 300);
        } else if (currentLevel === 2) {
            ctx.fillStyle = "#a40c00";
            ctx.fillText("Level - " + currentLevel + ". Kill all enemies to survive", 270, 300);
        }

    }

    drawEndLevelScene(currentLevel){
        ctx.font = "46px Impact, Charcoal, sans-serif";
        ctx.fillStyle = "#989800";
        ctx.fillText(" You have complete the level "+currentLevel+"\n", 310, 300);
        ctx.font = "26px Impact, Charcoal, sans-serif";
        ctx.fillStyle = "#a40c00";
        ctx.fillText("Your current score is - "+zscoreManager.currentScore(), 470, 330);
        ctx.font = "30px Impact, Charcoal, sans-serif";
        ctx.fillStyle = "#3553a4";
        ctx.fillText("Press \"space\" to continue... ", 425, 380);
    }

    drawEndGameScene(){

        ctx.font = "66px Impact, Charcoal, sans-serif";
        ctx.fillStyle = "#989790";
        ctx.fillText(" You have complete the game!", 230, 300);
        ctx.font = "36px Impact, Charcoal, sans-serif";
        ctx.fillStyle = "#a40c00";
        ctx.fillText("Your final score is - 8888888", 365, 360);
        ctx.font = "30px Impact, Charcoal, sans-serif";
        ctx.fillStyle = "#24a43a";
        ctx.fillText("Congratulations!", 520, 400);


    }

    drawText(text, size, x, y, baseline) {
        ctx.font = `${size}px arcade-classic`;
        ctx.textBaseline = baseline;
        context.textAlign = 'center';
        //ctx.fillStyle = 'white';

        let lineheight = size;
        let lines = text.split('\n');

        for (let i = 0; i < lines.length; i++)
            ctx.fillText(lines[i], x, y + (i * lineheight));

        //ctx.fillText(text, getCurrentCanvas().width / 2, getCurrentCanvas().height / 2);
    }

    drawScorePanel() {
        ctx.font = "46px Impact, Charcoal, sans-serif";
        ctx.fillStyle = "#574edd";
        ctx.fillText("Score: " + zscoreManager.currentScore(), 20, 50);
        ctx.fillText("Kills: " + zscoreManager.currentKills(), 1000, 50);
    }
}

class audioManager {
    constructor() {
        this.clips = {};
        this.context = null;
        this.gainNode = null;
        this.loaded = false;
        //! this.filter = null;

        this.defaultFrequency = 6600;
        this.lowFrequency = 150;
    }

    init() {

        this.context = new AudioContext();
        this.gainNode = this.context.createGain ? this.context.createGain() : this.context.createGainNode();
        this.filter = this.context.createBiquadFilter();
        this.filter.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);

        this.filter.type = "lowpass";
        this.filter.frequency.value = this.defaultFrequency;


    }

    load(path, callback) {
        if (this.clips[path]) {
            callback(this.clips[path]);
            return;
        }

        let clip = {
            path: path,
            buffer: null,
            loaded: false
        };

        clip.play = function (volume, loop) {
            zaudioManager.play(this.path, {looping: loop ? loop : false, volume: volume ? volume : 1});
        }

        this.clips[path] = clip;

        let request = new XMLHttpRequest();
        request.open('GET', path, true);
        request.responseType = 'arraybuffer';
        request.onload = function () {
            zaudioManager.context.decodeAudioData(request.response, function (buffer) {
                    clip.buffer = buffer;
                    clip.loaded = true;
                    callback(clip);
                    console.log(`Loaded clip: ${clip.path}`);
                }
            );
        };

        request.send();
    }

    loadArray(array) {
        for (let sound of array) {

            this.load(sound, function () {

                if (array.length === Object.keys(zaudioManager.clips).length) {
                    for (let sd in zaudioManager.clips) {
                        if (!zaudioManager.clips[sd].loaded) {
                            return;
                        }
                    }
                    zaudioManager.loaded = true;
                }

            });

        }
    }

    play(path, settings) {
        if (!zaudioManager.loaded) {
            setTimeout(() => {
                zaudioManager.play(path, settings);
            }, 50);

            return false;
        }   // return false;

        let looping = false;
        let volume = 1;

        if (settings) {
            if (settings.looping)
                looping = settings.looping;

            if (settings.volume)
                volume = settings.volume;
        }

        let sd = this.clips[path];

        if (sd === null)
            return false;

        let sound = zaudioManager.context.createBufferSource();
        sound.buffer = sd.buffer;
        sound.connect(zaudioManager.gainNode);
        sound.loop = looping;
        zaudioManager.gainNode.gain.value = volume;

        sound.start(0);
        return true;

    }

    playWorldSound(path, x, y) {
        if (zgameManager.player === null) {
            return;
        }

        let viewSize = max(zapManager().view.w, zapManager.view.h) * 0.5;

        let dx = Math.abs(zgameManager.player.pos_x - x);
        let dy = Math.abs(zgameManager.player.pos_y - y);

        let distance = sqrt(pow(dx, 2) + pow(dy, 2));

        let norm = distance / viewSize;

        if (norm > 1)
            norm = 1;

        let volume = 1.0 - norm;

        if (!volume)
            return;

        zaudioManager.play(path, {looping: false});
    }

    toggleMute() {
        if (this.gainNode.gain.value > 0)
            this.gainNode.gain.value = 0;
        else
            this.gainNode.gain.value = 1;
    }

    stopAll() {
        this.gainNode.disconnect();
        this.filter.disconnect();

        this.gainNode = this.context.createGain ? this.context.createGain() : this.context.createGainNode(0);
        this.filter = this.context.createBiquadFilter();
        this.filter.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);

        this.filter.type = "lowpass";
        this.filter.frequency.value = this.defaultFrequency;
    }

    frequencyRamp(fr, time) {
        zaudioManager.filter.frequency.exponentialRampToValueAtTime(fr, zaudioManager.context.currentTime + time);
    }
}

class eventManager {
    constructor(canvas) {
        this.bind = [];
        this.action = [];
        this.bind[87] = 'up';
        this.bind[65] = 'left';
        this.bind[83] = 'down';
        this.bind[68] = "right";
        this.bind[32] = 'fire';
        this.mouse = [0, 0];

    }

    setup() {
        canvas.addEventListener("mousedown", this.onMouseDown);
        canvas.addEventListener("mouseup", this.onMouseUp);
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("keyup", this.onKeyUp);
        canvas.addEventListener('mousemove', (ev) => {


            this.mouse[0] = ev.clientX;
            this.mouse[1] = ev.clientY;
        });
    }


    onMouseDown(event) {
        zeventManager.action["fire"] = true;
    }

    onMouseUp(event) {
        zeventManager.action["fire"] = false;
    }

    onKeyDown(event) {
        let action = zeventManager.bind[event.keyCode];
        if (action) {
            zeventManager.action[action] = true;
        }
    }

    onKeyUp(event) {
        let action = zeventManager.bind[event.keyCode];
        if (action) {
            zeventManager.action[action] = false;
        }
    }


}

class physicManager {

    update(obj) {

        let newX = 0, newY = 0;
        if (obj.name.match(/bullet_[\d*]/)) {
            newX = obj.pos_x;
            newY = obj.pos_y;
        }
        if (obj.name.match(/rocket_spe_[\d*]/)) {
            let newX = obj.pos_x,
                newY = obj.pos_y;
            newX -= Math.cos(obj.angle) * 21;
            newY -= Math.sin(obj.angle) * 21;
            let ts = zapManager.getTilesetIdx(newX + obj.size_x, newY + obj.size_y);
            let ts_back = zapManager.getTilesetIdx(newX, newY);

            let e = this.entityAtXY(obj, newX, newY);
            if (e !== null && obj.onTouchEntity) {
                if (!e.name.includes('bullet_') || !e.name.includes('rocket_spe_')) obj.onTouchEntity(e);
            }
            if (ts_back !== 4 || ts !== 4 && obj.onTouchMap) obj.onTouchMap(ts);
            // console.log(ts + ' ' + obj.name);


            if ((ts === 4 && ts_back === 4 && (e === null || e.name.includes('bullet_') || e.name.includes('rocket_spe_') || e.name.includes('zombie_')))) {
                obj.pos_x = newX;
                obj.pos_y = newY;
            }
        } else {
            newX = obj.pos_x + obj.speed * obj.move_x;
            newY = obj.pos_y + obj.speed * obj.move_y;

            let ts = zapManager.getTilesetIdx(newX + obj.size_x / 2, newY + obj.size_y / 2);
            let ts_back = zapManager.getTilesetIdx(newX, newY);

            /*костыль*/
            if(obj.name === "player"){
                if(ts === 1 || ts_back === 1) {
                    alert(ts);
                    alert(ts_back);
                    zgameManager.levelCompleted();
                    zscoreManager.calculateTotal();
                }
            }
            /*конец костыля*/

            let e = this.entityAtXY(obj, newX, newY);
            if (e !== null && obj.onTouchEntity) {
                obj.onTouchEntity(e)
            }
            if (ts_back !== 4 || ts !== 4 && obj.onTouchMap) obj.onTouchMap(ts);
            // console.log(ts + ' ' + obj.name);


            if ((ts === 4 || ts_back === 4 ) && (e === null || !obj.name.match(/zombie_[\d*]/))) {
                obj.pos_x = newX;
                obj.pos_y = newY;
            } else if (ts !== 4 && ts_back !== 4) {
                return "break";
            }
            return "move";
        }
        // else if (obj.move_x === 0 && obj.move_y === 0)
        //     return "stop";
    }


    entityAtXY(obj, x, y) {
        for (let i = 0; i < zgameManager.entities.length; i++) {
            let e = zgameManager.entities[i];
            // console.log(zgameManager.entities);
            if (e.name !== obj.name) {
                // console.log(e.name + "NAME");
                if (x + obj.size_x < e.pos_x ||
                    y + obj.size_y < e.pos_y ||
                    x > e.pos_x + e.size_x ||
                    y > e.pos_y + e.size_y)
                    continue;
                return e;
            }

        }
        return null;
    }


}

class gameManager {
    constructor() {
        this.factory = {};
        this.entities = [];
        this.fireNum = 0;
        this.player = null;
        this.laterKill = [];
        this.globalTimer = null;
    }

    initPlayer(obj) {
        this.player = obj;
    }

    kill(obj) {
        this.laterKill.push(obj);
    }

    updateG() {
        if (this.player === null) return;
        this.player.move_x = 0;
        this.player.move_y = 0;

        if (zeventManager.action["up"]) this.player.move_y = -1;
        if (zeventManager.action["down"]) this.player.move_y = 1;
        if (zeventManager.action["left"]) this.player.move_x = -1;
        if (zeventManager.action["right"]) this.player.move_x = 1;

        if (zeventManager.action["fire"]) this.player.fire();

        this.entities.forEach((e) => {
            try {
                e.update(e);
            } catch (ex) {
            }
        });

        for (let i = 0; i < this.laterKill.length; i++) {
            let idx = this.entities.indexOf(this.laterKill[i]);
            if (idx > -1)
                this.entities.splice(idx, 1);
        }
        if (this.laterKill.length > 0) this.laterKill.length = 0;
        zapManager.draw(ctx);
        // console.log("pos x " + this.player.move_x + "  y" + this.player.move_y);

        zapManager.centerAt(zgameManager.player.pos_x, zgameManager.player.pos_y);

        this.draw(ctx);
    }

    draw(ctx) {
        for (let e = 0; e < this.entities.length; e++)
            this.entities[e].draw(ctx);

        zscenesManager.drawScorePanel();
    }

    enemiesCount(){
        let count= 0;
       for(let name in this.entities) {
           if (this.entities[name].match(/zombie_[\d*]/)) {
               count++;

           }
       }
       return count;
    }


    clearScreen() {

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    stopScene() {
        clearInterval(this.globalTimer);
        this.entities = [];
        this.player = null;

        this.clearScreen();
    }

    reloadScene() {

        zscoreManager.clearCurrentRecords();
        //zaudioManager.stopAll();
        this.stopScene();
        zapManager.parseMap(JSON.stringify(zapManager.mapData));
        zapManager.parseEntities();
        this.play();

    }

    loadScene(sc) {
        // this.clearScreen();
        zapManager.jsonLoaded = 0;
        zapManager.imgLoaded = 0;
        zapManager.imgLoadCount = 0;
        zapManager.view = {x: 0, y: 0, w: 1200, h: 720};

        zapManager.loadMap(sc);
        setTimeout(this.loadSceneComplete, 10);
    }

    loadSceneComplete() {
        //console.log(`Loading scene:`);
        let jobs = 2;

        if (zapManager.jsonLoaded) {
            jobs--;
        }

        if (zapManager.imgLoaded) {
            jobs--;
        }

        if (jobs === 0) {
            // Launching
            zgameManager.reloadScene();
        } else {
            setTimeout(zgameManager.loadSceneComplete, 50);
        }
    }


    levelCompleted() {

        if (zeventManager.action['fire']) {

            completedLevel(zscoreManager.currentLevel);
            zeventManager.action['fire'] = false;

        } else {
            zgameManager.stopScene();
            zscenesManager.drawEndLevelScene(zscoreManager.currentLevel);
            setTimeout(zgameManager.levelCompleted, 20);
        }


    }


    loadRes() {
        console.log(`Loading resources:`);
        zscenesManager.drawLoadingScene();

        zpriteManager.loadAtlas("sprites (2).json", "spritesheet.png");
        zeventManager.setup();

        zaudioManager.init();
        zaudioManager.loadArray([
            'Nightcall.mp3',
            'shot.mp3',
            'theme_1.mp3',
            'theme_2.mp3',
            'death.mp3'
        ]);

        setTimeout(this.loadResComplete, 10);
    }

    loadResComplete() {

        let jobs = 3;
        if (zpriteManager.jsonLoaded) {
            jobs--;
        }
        if (zpriteManager.imgLoaded) {
            jobs--;
        }
        if (zaudioManager.loaded) {
            jobs--;
        }
        if (jobs === 0) {
            console.log(`[R]: COMPLETE`);
            resourcesLoaded();
        } else {
            setTimeout(zgameManager.loadResComplete, 10);
        }
    }

    play() {
        this.globalTimer = setInterval(() => {
            this.updateWorld()
        }, 30);
    }

    updateWorld() {
        zgameManager.updateG();
    }
}



var txt;
function startLevel(curr_lvl) {
    if(curr_lvl >=2){

        var person = prompt("Please enter your name:", "Harry Potter");
        if (person == null || person == "") {
            txt = "User cancelled the prompt.";
        } else {
            zscoreManager.storage[curr_lvl-2].name = person;
        }
        localStorage.setItem("name", person);
    }
    if (curr_lvl < 3) {
        zaudioManager.stopAll();
        zaudioManager.play("theme_" + curr_lvl + ".mp3", {looping: true});
        zaudioManager.filter.frequency.value = zaudioManager.lowFrequency;

        zscoreManager.currentLevel = curr_lvl;

        zscoreManager.save();

        zgameManager.clearScreen();
        zscenesManager.drawCurrentLevelScene(curr_lvl);

        setTimeout(() => {
            zaudioManager.frequencyRamp(zaudioManager.defaultFrequency, 1);
            zgameManager.loadScene('l_' + curr_lvl + '.json');
        }, 8000);

    } else {
        // let totalScore = 0;
        // for(let s of zscoreManager.localStorage.total) {
        //     totalScore += s.score;
        // }

        // let totalScore = 0;
        // for(let s of getScoreManager().storage) {
        //     totalScore += s.score;
        // }
        //
        zscoreManager.save();
        zgameManager.clearScreen();
        zscenesManager.drawEndGameScene();

    }
}

function resourcesLoaded() {
    setTimeout(() => {
        startLevel(zscoreManager.currentLevel)
    }, 100);
    console.log('loaded all');
}

function completedLevel(lvl) {
    startLevel(lvl + 1);
}

function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
                // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

function scoreboard(en) {
    let scoreboardElement = document.getElementById('scoreboard');
    let scoreboardTextElement = document.getElementById('scoreboard-text');
    if(en) {
        scoreboardTextElement.innerHTML = ' ';
        scoreboardElement.style.display = 'block';

        for(let i = 0; i < 10; i++) {
            scoreboardElement.style.color = "white";
            scoreboardTextElement.innerHTML += (`Name: ${zscoreManager.storage[i].name}<br />`);
            scoreboardTextElement.innerHTML += (`Enemies killed: ${zscoreManager.storage[i].killed}<br />`);
            scoreboardTextElement.innerHTML += (`Score: ${zscoreManager.storage[i].score}<br /><br />`);
        }

    } else {
        scoreboardElement.style.display = 'none';
    }
}


let zeventManager = new eventManager();
let zapManager = new mapManager();
let zpriteManager = new spriteManager();
let zphysicManager = new physicManager();
let zgameManager = new gameManager();
let zscenesManager = new scenesManager();
let zscoreManager = new scoreManager();
let zaudioManager = new audioManager();
zgameManager.factory['Player'] = new Player();
zgameManager.factory['Zombie'] = new Zombie();

function start() {
    zscoreManager.load();
    zgameManager.loadRes();
    zgameManager.play();
}

// {
//     zapManager.loadMap("test_new_tiles.json ");
//         // zgameManager.factory['Rocket'] = new Rocket();
//     zapManager.parseEntities();
//
//     //zaudioManager.filter.frequency.value = zaudioManager.lowFrequency;
//     zapManager.draw(ctx);
//
// }
