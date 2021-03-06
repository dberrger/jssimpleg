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
        this.view = {x: 0, y: 0, w: 800, h: 600};
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
            // console.log("na veroch ku load img: " + this.imgLoaded);
            // console.log(" this.mapData.tilesets[i].image: " + this.mapData.tilesets[i].image);
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
        // console.log("DRAW load json: " + this.jsonLoaded);
        // console.log("DRAW load img onload: " + this.imgLoaded);
        setTimeout(() => {
            //console.log("DRAW load json: " + this.jsonLoaded)
        }, 1000);
        if (this.imgLoaded === 0 || this.jsonLoaded === 0) {
            setTimeout(() => {
                this.draw(ctx)
            }, 100);
        } else {

            // console.log("---------------------------------");
            // console.log("DRAW load json: " + this.jsonLoaded);
            // console.log("DRAW load img onload: " + this.imgLoaded);
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
        this.dx = 0;
        this.dy = 0;
        this.size_x = 0;
        this.size_y = 0;
    }
}

class Player extends Entity {
    constructor() {
        super();
        this.lifetime = 100;
        this.move_x = 1;
        this.move_y = 1;
        this.speed = 15;
        this.jump_start_pos_x = 200;
        this.jump_start_pos_y = 0;
    }

    draw(ctx) {


        zpriteManager.drawSprite(ctx, "player_run (", this.pos_x, this.pos_y);
    }

    update(obj) {
        //alert("Here");
        //alert(obj.name);
        zphysicManager.update(obj);

    }

    onTouchEntity(obj) {

        alert(obj.name + "Zombie collide!");
    }

    kill() {

    }
    onTouchMap(idx){

    }

    fire() {
        let r = new Rocket();
        r.size_x = 32;
        r.size_y = 32;
        r.name = "rocket" + (++gameManager.fireNum);
        r.move_x = this.move_x;
        r.move_y = this.move_y;
        switch (this.move_x + 2 * this.move_y) {
            case-1: //left
                r.pos_x = this.pos_x - r.size_x;
                r.pos_y = this.pos_y;
                break;
            case 1: //right
                r.pos_x = this.pos_x + this.size_x;
                r.pos_y = this.pos_y;

            // up -
            // down -
        }
        gameManager.entities.push(r);
    }


}

class Zombie extends Entity {
    constructor() {
        super();
        this.lifetime = 120;
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 2;
    }

    draw(ctx) {

        zpriteManager.drawSprite(ctx, "zombie_run (", this.pos_x, this.pos_y);
    }

    update(obj) {

        zphysicManager.update(obj);
    }

    onTouchEntity(obj) {
        alert(obj.name + "Zombie collide!");
        this.kill();

    }

    kill() {

    }

    fire() {
        let r = new Rocket();
        r.size_x = 32;
        r.size_y = 32;
        r.name = "rocket" + (++gameManager.fireNum);
        r.move_x = this.move_x;
        r.move_y = this.move_y;
        switch (this.move_x + 2 * this.move_y) {
            case-1: //left
                r.pos_x = this.pos_x - r.size_x;
                r.pos_y = this.pos_y;
                break;
            case 1: //right
                r.pos_x = this.pos_x + this.size_x;
                r.pos_y = this.pos_y;

            // up -
            // down -
        }
        gameManager.entities.push(r);

    }
}

class Rocket extends Entity {
    constructor() {
        super();
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 4;
    }

    draw(ctx) {
        zpriteManager.drawSprite(ctx, "Walk (3)", this.pos_x, this.pos_y);
    }

    update() {
        zphysicManager.update(this);
    }

    onTouchEntity(obj) {

    }

    onTouchMap(idx) {
        alert(idx+ "Che za huita?");
    }

    kill() {

    }

    fire() {

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

        name += glob + ")";

        glob++;
        if (glob >= 9) glob = 1;
        // console.log("MY NAME IS _+=>", name);
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(() => {
                this.drawSprite(ctx, name, x, y)
            }, 100);
        } else {
            let sprite = this.getSprite(name);
            if (!zapManager.isVisible(x, y, sprite.w, sprite.h)) return;
            x -= zapManager.view.x;
            y -= zapManager.view.y;
            ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
        }
    }

    getSprite(name) {
        // console.log("NAME!=> +>", name);
        for (let i = 0; i < this.sprites.length; i++) {
            let s = this.sprites[i];
            // console.log("NAME!=> ", i, "+>", s);
            if (s.name === name) return s;
        }
        return null;
    }
}


class eventManager {
    constructor() {
        this.bind = [];
        this.action = [];
        this.bind[38] = 'up';
        this.bind[37] = 'left';
        this.bind[40] = 'down';
        this.bind[39] = "right";
        this.bind[32] = 'fire';
    }

    setup() {
//TODO rewrite
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("keyup", this.onKeyUp);
    }

    onKeyDown(event) {
        //console.log("1CLICKED = > " + event.keyCode);
        let action = zeventManager.bind[event.keyCode];
        if (action) {
            zeventManager.action[action] = true;
            // console.log("CLICKED = > " + zeventManager.action[action]);
        }
    }

    onKeyUp(event) {

        // console.log("1CLICKED = > " + event.keyCode);
        let action = zeventManager.bind[event.keyCode];
        if (action) {
            zeventManager.action[action] = false;
            //  console.log("CLICKED = > " + zeventManager.action[action]);
        }
    }
}


class physicManager {

    update(obj) {
        if (obj.move_x === 0 && obj.move_y === 0)
            return "stop";

        let newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
        let newY = obj.pos_y;
        if (obj.move_y === -5 && obj.name === "player") { // if clicked

            if (obj.jump_start_pos_x > 0) {
                //  alert("ONCE"+ obj.jump_start_pos_x);
                newY -= 90;
                obj.jump_start_pos_x -= 100;
            } else if (obj.jump_start_pos_x <= 0 && obj.jump_start_pos_y !== 200) {
                newY += 90;
                obj.jump_start_pos_y += 100;
                if (obj.jump_start_pos_y === 200 && 0 === obj.jump_start_pos_x) {
                    obj.jump_start_pos_y = 0;
                    obj.jump_start_pos_x = 200;
                    obj.move_y = 0;
                }
            }
        }

        let ts = zapManager.getTilesetIdx(newX+ obj.size_x/2, obj.pos_y+ obj.size_y/2);
        console.log("BLOCK # " + ts);
        // if (ts === 6) {
        //         obj.pos_y += 1;
        //     }
        //     else if (ts === 3) {
        //         obj.pos_x -= 5;
        //         obj.pos_y -= 5;
        //     }

            obj.pos_x = newX;
             obj.pos_y = newY;
            let e = this.entityAtXY(obj, newX, obj.pos_y);
            if (e !== null && obj.onTouchEntity) //obj.onTouchEntity(e);
            if (ts === 6) obj.onTouchMap(ts);
            if (ts !== 3 && e !== null) {
               // console.log("NeX" + newX + " NeY" + newY);

            } else {
                return "break";
            }
            return "move";
        }

        entityAtXY(obj, x, y)
        {
            for (let i = 0; i < zgameManager.entities.length; i++) {
                let e = zgameManager.entities[i];
                if (e.name !== obj.name) {
                    if (x + obj.size_x < e.pos_x ||
                        y + obj.size_y < e.pos_y ||
                        x > e.pos_x + e.size_x ||
                        y > e.pos_x + e.size_y)
                        continue;
                } else {
                    console.log("Zzzzzzz "+e.name);
                    return e;
                }

            }
            return null;
        }


    }

    class
    gameManager {
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
        // this.player.move_y = 0;

        if (zeventManager.action["up"]) this.player.move_y = -5;
        if (zeventManager.action["down"]) this.player.move_y = 4;
        if (zeventManager.action["left"]) this.player.move_x = -5;
        if (zeventManager.action["right"]) this.player.move_x = 4;

        this.entities[1].move_x = this.player.move_x;
        this.entities[1].move_y = this.player.move_y;

        // start pos for jump

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
        console.log("pos x " + this.player.move_x + "  y" + this.player.move_y);
        zapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.draw(ctx);
    }

    draw(ctx) {

        for (let e = 0; e < this.entities.length; e++)
            this.entities[e].draw(ctx);
    }

    loadAll() {
        zapManager.loadMap("longMap.json ");
        zpriteManager.loadAtlas("sprites_2.json", "spritesheet_2.png");
        zgameManager.factory['Player'] = new Player();
        zgameManager.factory['Zombie'] = new Zombie();
        zapManager.parseEntities();
        zeventManager.setup();
        zapManager.draw(ctx);

    }

    play() {
        setInterval(() => {
            this.updateWorld()
        }, 100);
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

zgameManager.factory['Player'] = new Player();
zgameManager.factory['Zombie'] = new Zombie();
zgameManager.loadAll();
zgameManager.play();