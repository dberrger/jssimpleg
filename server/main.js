var canvas = document.getElementById('game');
var ctx = canvas.getContext("2d");
var glob = 1;

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
                    alert(1);
                    this.imgLoaded = 1;
                }

                // console.log(" load img onload: " + this.imgLoaded);
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
            // console.log(" lenggg : " + this.tilesets.length);
        }
        this.jsonLoaded = 1;
        //  console.log(" load json: " + this.jsonLoaded);
        // console.log(" load img onload: " + this.imgLoaded);
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


    }
}

class Entity {
    constructor() {
        this.pos_x = 0;//{x: 0, y:0, dx: 0, dy: 0};
        this.pos_y = 0;
        this.size_x = 0;
        this.size_y = 0;
        this.right = 0;
        this.left = 0;
        this.up = 1;
        this.down = 0;


    }
}

class Player extends Entity {
    constructor() {
        super();
        this.lifetime = 100;
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 15;

    }

    draw(ctx) {
        zpriteManager.drawSprite(ctx, "sprite265", this.pos_x, this.pos_y);
    }

    update(obj) {
        zphysicManager.update(obj);

    }

    onTouchEntity(obj) {
        console.log("touched " + this.name);
        // alert(obj.name + "Zombie collide!");
    }

    kill() {
        // alert("You're dead!");
        // document.location.reload();
    }

    onTouchMap(idx) {

    }

    fire() {
        let r = new Rocket();
        r.size_x = 10;
        r.size_y = 8;
        r.name = "rocket_" + (++zgameManager.fireNum);
        // if(zgameManager.player.pos_x > zeventManager.mouse[0] || zeventManager.mouse[1] < zgameManager.player.pos_y )
        //     r.angle = -1* Math.atan2(zeventManager.mouse[1] - zgameManager.player.pos_y, zeventManager.mouse[0] - zgameManager.player.pos_x);
        //  else
        r.angle = ( Math.atan2(zeventManager.mouse[1] - zgameManager.player.pos_y, zeventManager.mouse[0] - zgameManager.player.pos_x) +360 )% 360 ;

        //(x > 0 ? x : (2*PI + x)) * 360 / (2*PI)
        console.log("PLAYER POS +=: "+ zgameManager.player.pos_x+" "+zgameManager.player.pos_y);
        console.log("mouse POS +=: "+ zeventManager.mouse[0]+" "+zeventManager.mouse[1]);
        console.log(r.angle);
        r.pos_x =   zgameManager.player.pos_x - 11;
        r.pos_y =  zgameManager.player.pos_y - 11;

        zgameManager.entities.push(r);
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
    }

    draw(ctx) {

        zpriteManager.drawSprite(ctx, "sprite666", this.pos_x, this.pos_y);
    }

    update(obj) {

        zphysicManager.update(obj);
        this.move_x = 1;

        this.fire();
        this.move_x = -1;
    }

    onTouchEntity(obj) {

        this.kill();

    }

    kill() {
        for (let i = 0; i < zgameManager.entities.length; i++) {
            let e = zgameManager.entities[i];
            if (e.name === this.name) {
                console.log("| name of fly | " + e.name + "pos x : " + e.pos_x + " pos .y: " + e.pos_y);
                zgameManager.entities.splice(i, 1);
            }
        }
    }

    fire() {

       //  let r = new Rocket();
       //  r.size_x = 10;
       //  r.size_y = 8;
       //  r.name = "rocket_" + (++zgameManager.fireNum);
       //  // r.move_x = this.move_x;
       //  // r.move_y = this.move_y;
       //  // console.log(this.move_x + " mv " + this.move_y);
       //  r.angle = Math.atan((zgameManager.player.pos_y -zeventManager.mouse[1] )/ (zgameManager.player.pos_x -zeventManager.mouse[0] ));
       //
       // r.pos_x = zgameManager.player.pos_x + 50 * this.speed * Math.cos(r.angle);
       // r.pos_y =zgameManager.player.pos_y + 50 * this.speed * Math.sin(r.angle);
       //  zgameManager.entities.push(r);

    }
}

class Rocket extends Entity {
    constructor() {
        super();
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 1;
    }

    draw(ctx) {
        zpriteManager.drawSprite(ctx, "sprite467", this.pos_x, this.pos_y);
    }

    update() {
        zphysicManager.update(this);
    }

    onTouchEntity(obj) {
        //console.log(obj);
        if (obj.name.match(/zombie_[\d*]/) || obj.name.match(/player/) ||
            obj.name.match(/rocket_[\d*]/)) {
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
            }, 100);
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
            //  console.log("CLICKED = > " + |z|e|v|e|n|t| Manager.action[action]);
        }
    }


}


class physicManager {

    update(obj) {

        if(obj.name.match(/rocket_[\d*]/)) {
            obj.pos_x +=  Math.cos(obj.angle)*21;
            obj.pos_y +=   Math.sin(obj.angle)*21;
        }
        let newX = obj.pos_x + obj.speed / 2 * obj.move_x;
        let newY = obj.pos_y + obj.speed / 2 * obj.move_y;

        let ts = zapManager.getTilesetIdx(newX + obj.size_x / 2, newY + obj.size_y / 2);
        let ts_back = zapManager.getTilesetIdx(newX, newY);
        if (obj.name === "player")
            console.log("ts_back " + ts_back);
        let e = this.entityAtXY(obj, newX, newY);
        if (e !== null && obj.onTouchEntity) obj.onTouchEntity(e);
        if (ts_back !== 2 || ts !== 2 && obj.onTouchMap) obj.onTouchMap(ts);
        // console.log(ts + ' ' + obj.name);
        if (ts === 2 && ts_back === 2 && e === null) {
            obj.pos_x = newX;
            obj.pos_y = newY;
            this.wheresFace(obj);
            // console.log(obj);
        } else
            return "break";
        return "move";

        // else if (obj.move_x === 0 && obj.move_y === 0)
        //     return "stop";
    }

    //     if (obj.name === "Zombie") {
    //         obj.pos_y -= 10;
    //         obj.pos_x += 10;
    //     }
    //     if (obj.name === "rocket") {
    //
    //         let e1 = this.entityAtXY(obj, obj.pos_x, obj.pos_y);
    //         if (e1) console.log("KILL!");
    //
    //         if (zapManager.getTilesetIdx(obj.pos_x + obj.size_x / 2, obj.pos_y + obj.size_y / 2) === 1) {
    //
    //             for (let i = 0; i < zgameManager.entities.length; i++) {
    //                 let e = zgameManager.entities[i];
    //                 if (e.name === obj.name) {
    //                     console.log("| name of fly | " + e.name + "pos x : " + e.pos_x + " pos .y: " + e.pos_y);
    //                     zgameManager.entities.splice(i, 1);
    //                 }
    //             }
    //         }
    //     }
    //
    //
    //
    //     // let e = this.entityAtXY(obj, newX, newY);
    //     // newYif (e !== null && obj.onTouchEntity) obj.onTouchEntity(e);
    //     // if (ts !== 1 && obj.onTouchMap)
    //     //     obj.onTouchMap(ts);
    //     // alert(ts);
    //     if (ts === 2) {
    //         obj.pos_x = newX;
    //         obj.pos_y = newY;
    //     } else {
    //         return "break";
    //     }
    //     return "move";
    // }

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

    wheresFace(obj) {
        if (obj.move_x === -1) {
            obj.left = 1;
            obj.right = 0;
            obj.down = 0;
            obj.up = 0
        }
        else if (obj.move_x === 1) {
            obj.left = 0;
            obj.right = 1;
            obj.down = 0;
            obj.up = 0
        }
        else if (obj.move_y === -1) {
            obj.left = 0;
            obj.right = 0;
            obj.down = 0;
            obj.up = 1
        }
        else if (obj.move_y === 1) {
            obj.left = 0;
            obj.right = 0;
            obj.down = 1;
            obj.up = 0
        }
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

// load json -> parse -> draw map;
// zapManager.loadMap("objgr.json");
// zapManager.parseEntities();
// zapManager.draw(ctx);

zgameManager.loadAll();
zgameManager.play();