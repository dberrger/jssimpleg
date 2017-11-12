var canvas = document.getElementById('game');
var ctx = canvas.getContext("2d");
var glob = 1;
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
        document.location.reload();
    }

    fire() {
        if (this.fire_delay) {
            let r = new Rocket();
            r.size_x = 10;
            r.size_y = 8;
            r.name = "bullet_" + (++zgameManager.fireNum);
            let xy1 = zapManager.centerAt(zgameManager.player.pos_x, zgameManager.player.pos_y);
            let Vx = zeventManager.mouse[0] + xy1.x - zgameManager.player.pos_x - zgameManager.player.size_x / 2;
            let Vy = zeventManager.mouse[1] + xy1.y - zgameManager.player.pos_y - zgameManager.player.size_y / 2;

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
            this.fire_delay = false;
            setTimeout(() => {
                this.fire_delay = true;
            }, r.delay);
        }
    }


    getBulletStartPos(angle) {
        let StartXPos = (zgameManager.player.pos_x ) + Math.cos(angle) * 30;
        let StartYPos = (zgameManager.player.pos_y ) + Math.sin(angle) * 30;


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
        let Vx = this.pos_x - zgameManager.player.pos_x - zgameManager.player.size_x / 2;
        let Vy = this.pos_y - zgameManager.player.pos_y - zgameManager.player.size_y / 2;

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
            let Vx = this.pos_x - zgameManager.player.pos_x - zgameManager.player.size_x / 2;
            let Vy = this.pos_y - zgameManager.player.pos_y - zgameManager.player.size_y / 2;

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
        //    console.log("PP   " + zgameManager.player.pos_x + " " + zgameManager.player.pos_y);
        //    console.log("TS " + obj.name + " " + zapManager.getTilesetIdx(obj.pos_x, obj.pos_y));
        if (ts_back === 2 || ts === 2) {
            if (this.distance(obj.pos_x, zgameManager.player.pos_x, obj.pos_y, zgameManager.player.pos_y) < 500) {
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
        } else if (ts_back === 1 || ts === 1) {
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
        //zpriteManager.drawSprite(ctx, "sprite467", this.pos_x, this.pos_y);
    }

    update() {
        zphysicManager.update(this);
    }

    onTouchEntity(obj) {
        // console.log(obj);
        if (obj.name.includes('rocket_spe_')) {
            obj.kill();
            this.kill();
        }
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
        zphysicManager.update(this);
    }

    onTouchEntity(obj) {
        //console.log(obj);
        // if (obj.name === "player" && this.name.match(/rocket_spe_[\d*]/)) {
        //     this.owner.canIwalk = true;
        // } else {
        //     this.owner.canIwalk = false;
        // }
        if (obj.name.match(/zombie_[\d*]/) || obj.name.match(/player/)) {
            //alert(obj.name);

            obj.kill();
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
                ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
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

        if (obj.name.match(/bullet_[\d*]/)) {
            let newX = obj.pos_x,
                newY = obj.pos_y;

                //alert(obj.owner.name);
            if(obj.owner.name === "player") {
                newX += Math.cos(obj.angle) * 12;
                newY += Math.sin(obj.angle) * 12;
            }else {
                newX -= Math.cos(obj.angle) * 22;
                newY -= Math.sin(obj.angle) * 22;
            }
            let e = this.entityAtXY(obj, newX, newY);
            let ts = zapManager.getTilesetIdx(newX + obj.size_x, newY + obj.size_y);
            let ts_back = zapManager.getTilesetIdx(newX, newY);
            if (e !== null && obj.onTouchEntity) {
                console.log("naem " + e.name);
                if (!e.name.includes('rocket_spe_')) obj.onTouchEntity(e);
                else console.log("HIT " + e.name);
            }
            if (ts_back !== 2 || ts !== 2 && obj.onTouchMap) obj.onTouchMap(ts);
            // console.log(ts + ' ' + obj.name);
            if ((ts === 2 && ts_back === 2 && (e === null || e.name.includes('rocket_spe_')))) {
                obj.pos_x = newX;
                obj.pos_y = newY;
            }
        }
        if (obj.name.match(/rocket_spe_[\d*]/)) {
            // obj.bullet_timer++;
            let newX = obj.pos_x,
                newY = obj.pos_y;
            newX -= Math.cos(obj.angle) * 61;
            newY -= Math.sin(obj.angle) * 61;
            let ts = zapManager.getTilesetIdx(newX + obj.size_x, newY + obj.size_y);
            let ts_back = zapManager.getTilesetIdx(newX, newY);

            let e = this.entityAtXY(obj, newX, newY);
            if (e !== null && obj.onTouchEntity) {
                console.log("imya " + e.name);
                if (!e.name.includes('bullet_') || !e.name.includes('rocket_spe_')) obj.onTouchEntity(e);
                else console.log("huit " + e.name);
            }
            if (ts_back !== 2 || ts !== 2 && obj.onTouchMap) obj.onTouchMap(ts);
            // console.log(ts + ' ' + obj.name);


            if ((ts === 2 && ts_back === 2 && (e === null || e.name.includes('bullet_') || e.name.includes('rocket_spe_') || e.name.includes('zombie_')))) {
                obj.pos_x = newX;
                obj.pos_y = newY;
            }


        } else {
            let newX = obj.pos_x + obj.speed * obj.move_x;
            let newY = obj.pos_y + obj.speed * obj.move_y;

            let ts = zapManager.getTilesetIdx(newX + obj.size_x / 2, newY + obj.size_y / 2);
            let ts_back = zapManager.getTilesetIdx(newX, newY);

            let e = this.entityAtXY(obj, newX, newY);
            if (e !== null && obj.onTouchEntity) {
                obj.onTouchEntity(e)
            }
            if (ts_back !== 2 || ts !== 2 && obj.onTouchMap) obj.onTouchMap(ts);
            // console.log(ts + ' ' + obj.name);


            if ((ts === 2 || ts_back === 2 ) && (e === null || !obj.name.match(/zombie_[\d*]/))) {
                obj.pos_x = newX;
                obj.pos_y = newY;
            } else if (ts === 1 && ts_back === 1) {
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
    }

    loadAll() {
        zapManager.loadMap("newBorn.json ");
        zpriteManager.loadAtlas("sprites (2).json", "spritesheet.png");
        zgameManager.factory['Player'] = new Player();
        zgameManager.factory['Zombie'] = new Zombie();
        // zgameManager.factory['Rocket'] = new Rocket();
        zapManager.parseEntities();
        zeventManager.setup();
        zapManager.draw(ctx);

    }

    play() {
        setInterval(() => {
            this.updateWorld()
        }, 30);
    }

    updateWorld() {
        zgameManager.updateG();
    }
}


let zeventManager = new eventManager();
let zapManager = new mapManager();
let zpriteManager = new spriteManager();
let zphysicManager = new physicManager();
let zgameManager = new gameManager();


zgameManager.loadAll();
zgameManager.play();