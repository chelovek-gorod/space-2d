'use strict';

const SIZE_PI = Math.PI;
const SIZE_2PI = Math.PI * 2;
const SIZE_PI_DIV_2 = Math.PI / 2;
const SIZE_3PI_DIV_2 = (Math.PI * 3) / 2;

const CANVAS_SCALE = 2;

/*
top ----> SIZE_PI_DIV_2
right --> 0 and SIZE_2PI
bottom -> SIZE_3PI_DIV_2
left ---> SIZE_PI
*/

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

document.body.prepend(canvas);

var background = new Image();
background.src = "./src/images/space-bg.jpg";
background.width = 3840;
background.height = 2160;

let vw, vh, vcx, vcy, bgX, bgY, bgW, bgH, outside, maxStars;

window.addEventListener('resize', updateSizes);
function updateSizes() {
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    canvas.width = vw = window.innerWidth * CANVAS_SCALE;
    canvas.height = vh = window.innerHeight * CANVAS_SCALE;

    vcx = Math.floor(vw / 2);
    vcy = Math.floor(vh / 2);

    ctx.font = '24px Roboto-Regular, Arial, sans-serif';
    ctx.fillStyle = '#00ff00';
    ctx.textBaseline = 'top';

    let k_w = background.width / window.innerWidth;  // 3840/360 = 10.67  or 3840/720 = 5.33
    let k_h = background.height / window.innerHeight; // 2400/720 = 3,33  or 2400/360 = 6.67
    let k = k_w < k_h ? k_w : k_h;    // 3,33  or  5.33
    bgW = Math.floor(window.innerWidth * k);         // 1198  or  3837
    bgH = Math.floor(window.innerHeight * k);         // 2397  or  1918
    bgX = Math.floor((background.width - bgW) / 2);
    bgY = Math.floor((background.height - bgH) / 2);

    outside = (vw > vh) ? Math.floor(vw / 4) : Math.floor(vh / 4);

    maxStars = Math.ceil( window.innerWidth * window.innerHeight / 1000 );
    //maxStars = 0;
}
updateSizes();

function getDistance (x1, y1, x2, y2) {
    return Math.sqrt( Math.pow( (x1 - x2), 2) + Math.pow( (y1 - y2), 2) );
}

class Star {
    constructor(x, y, weight) {
        // 0 - top; 1 - right; 2 - bottom; 3 - left.
        let side = Math.floor( Math.random() * 4 );

        this.x = x || this.init('x', side);
        this.y = y || this.init('y', side);

        let speed = Math.ceil( Math.random() / 10000 );
        let dx = this.init('dy');
        let dy = this.init('dy');
        let path = Math.sqrt( Math.pow(dx, 2) + Math.pow(dy, 2) );
        let steps = path / speed;

        this.stepX = (x && y) ? 0 : dx / steps;
        this.stepY = (x && y) ? 0 : dy / steps;

        this.weight = weight || Math.ceil( Math.random() * 10 );
        this.size = Math.sqrt(this.weight); // w=1 -> s=1; w=5 -> s=2.24; w=10 -> s=3.16;
        this.temperature = Math.ceil(Math.random() * 765); // w=1 -> s=1; w=5 -> s=2.24; w=10 -> s=3.16;
        this.energy = this.weight ** 3;
        this.expend = Math.sqrt(this.size);

        this.isExist = true;
    }

    init(type, side) {
        switch(type) {
            case 'x' : return (side === 0 || side === 2) ? Math.floor(Math.random() * vw) : (side === 1)? vw : 0;
            case 'y' : return (side === 1 || side === 3) ? Math.floor(Math.random() * vh) : (side === 2) ? vh : 0;
            case 'dx' : return Math.floor(Math.random() * vw) - this.x;
            case 'dy' : return Math.floor(Math.random() * vh) - this.y;
        }
    }

    draw() {
        // DRAW
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, SIZE_2PI, false);
        ctx.fillStyle = this.getColor();
        ctx.fill();

        // TEXT
        if (this.size > 15) {
            let text1 = `W: ${Math.ceil(this.weight)}; r: ${Math.round(this.size)}`;
            let text2 = `E: ${Math.ceil(this.energy)}; (exp.: ${(this.expend).toFixed(3)})`;
            let text3 = `t: ${Math.round(this.temperature)};`;
            ctx.fillStyle = '#00ff00';
            ctx.fillText  (text1, this.x + this.size + 5, this.y - this.size);
            ctx.fillText  (text2, this.x + this.size + 5, this.y - this.size + 26);
            ctx.fillText  (text3, this.x + this.size + 5, this.y - this.size + 52);
        }

        // MOVE
        this.x += this.stepX;
        this.y += this.stepY;

        // CHECK OUTSIDE
        if (this.x + this.size + this.stepX < -outside
        || this.x - this.size - this.stepX > vw + outside
        || this.y + this.size + this.stepY < -outside
        || this.y - this.size - this.stepY > vh + outside)
        {
            this.isExist = false;
        } else if (this.weight > 1000) {
            starsArr.push( new BlackHole ({...this, color: this.getColor()}) );
            this.isExist = false;
        } else {
        // RECALCULATE AND BURN
            this.size = Math.sqrt(this.weight);
            this.expend = Math.sqrt(this.size);
            this.updateTemperature();
        }
    }

    updateTemperature() {
        if (this.energy >= this.expend) {
            this.energy -= this.expend;
            this.temperature += this.expend / this.size;
        } else {
            const T = this.expend * this.size / this.weight;
            if (this.temperature > T) this.temperature -= T;
            else if (this.weight < 100) {
                this.weight -= this.expend / this.weight;
                if (this.weight < 1) this.isExist = false;
            }
            else {
                this.isExist = false;
                explosionsArr.push( new Explosion(this.x, this.y, this.weight, this.size) );
                starsArr.push( new Star(this.x, this.y, this.weight / 2) );
            }
        }
    }

    getColor() {
        const T = Math.ceil(this.temperature);

        if (T > 764) return `rgb(0, 255, 255)`;   
        if (T > 510)  return `rgb(${255 - (T - 510)}, 255, 255)`;  // R: 1...254
        if (T > 255)  return `rgb(255, 255, ${T - 255})`; // B: 1...255
        return `rgb(255, ${T}, 0)`; // G: 0...255
    }

    confluence(weight, energy) {
        this.weight += weight * 0.7;
        this.energy += energy * 0.3;  
    }

    getGravity(x, y, weight, distance) {
        let dx = this.x - x;
        let dy = this.y - y;
        let G = weight / (distance * distance);
        this.stepX -= (dx * G) / 100;
        this.stepY -= (dy * G) / 100;
    }
}

canvas.addEventListener('click', event => starsArr.push( new Star(event.x * CANVAS_SCALE, event.y * CANVAS_SCALE) ) );

canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    let [xx, yy] = [event.x * CANVAS_SCALE, event.y * CANVAS_SCALE];
    for(let i = 0; i < starsArr.length; i++) {
        let [x1, x2] = [starsArr[i].x - starsArr[i].size, starsArr[i].x + starsArr[i].size];
        let [y1, y2] = [starsArr[i].y - starsArr[i].size, starsArr[i].y + starsArr[i].size];
        if (xx > x1 && xx < x2 && yy > y1 && yy < y2) {
            starsArr[i].energy = 0;
            starsArr[i].temperature /= 2;
            break;
        }
    }
});

let newStarSize = 100;
let newStarSizeDilay = 0;
let newStarSizeDilayStart = 100;

canvas.addEventListener('wheel', event => {
    event.preventDefault();
    if (event.wheelDelta > 0) newStarSize += 25;
    else if (newStarSize > 25) newStarSize -= 25;
    newStarSizeDilay = newStarSizeDilayStart;
});

canvas.addEventListener('mousedown', event => {
    if (event.which === 2) {
        event.preventDefault();
        starsArr.push( new Star(event.x * CANVAS_SCALE, event.y * CANVAS_SCALE, newStarSize) );
    }
});

class Explosion {
    constructor(x, y, weight, size) {
        this.steps = Math.ceil(weight);

        this.opacity = 1;
        this.opacitySub = Number( (1 / this.steps).toFixed(3) );

        let maxSize = size ** 2;
        this.size = size / 2;
        this.sizeAdd = (maxSize - this.size) / this.steps;

        this.lineWidth = size / 2;
        this.lineWidthSub = this.lineWidth / this.steps;

        this.colorG = 255;
        this.colorB = 255;

        this.x = x;
        this.y = y;

        // G -1; B -2
        this.colorG = 255;
        this.colorB = 255;
        this.colorGreenSub = 255 / (this.steps * 0.7);
        this.colorBlueSub = 255 / (this.steps * 0.4);

        this.isExist = true;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, SIZE_2PI, false);
        ctx.strokeStyle = `rgba(128, ${this.colorG}, ${this.colorB}, ${this.opacity})`;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke(); 
        
        if (this.opacity > 0) {
            this.opacity -= this.opacitySub;
            this.size += this.sizeAdd;
            this.lineWidth -= this.lineWidthSub;

            if (this.colorB >= this.colorBlueSub) this.colorB -= this.colorBlueSub;
            if (this.colorG >= this.colorGreenSub) this.colorG -= this.colorGreenSub;
        } else {
            this.isExist = false;
        }
    }
}

class BlackHole {
    constructor (star) {
        this.x = star.x;
        this.y = star.y;
        this.size = star.size;
        this.weight = star.weight;
        this.energy = star.energy;
        this.color = star.color.slice(3, -1); // '(0, 255, 255'
        this.colorOpacity = 1;
        this.colorOpacitySub = 0.01;
        this.ellipseOpacity = 0;
        this.ellipseOpacitySub = 0.01;

        this.angle = SIZE_2PI * Math.random();
        // this.angle = SIZE_PI_DIV_2;
        let isClockwise = Math.random() < 0.5 ? true : false;
        let angleChangeSize = 0.001 * Math.random();
        this.angleAdd = isClockwise ? angleChangeSize : -angleChangeSize;
        // this.angleAdd = 0;

        this.tintLineOpcity = 0;
        this.isRiseTintLineOpcity = true;

        this.tintLineSizeK = 1;
        this.isRiseTintLineSizeK = false;

        this.tintLineStep = 0.005; // LineSize & Opcity

        this.stepX = star.stepX / this.size;
        this.stepY = star.stepY / this.size;

        this.isExist = true;
    }

    draw() {
        // PREPARE
        let ellipseSizeX = this.size * 0.2;
        let ellipseSizeY = this.size * 1.3;

        let backEllipseStart = SIZE_PI_DIV_2 + SIZE_2PI;
        let backEllipseEnd = SIZE_PI_DIV_2 + SIZE_PI;

        let frontEllipseStart = SIZE_PI_DIV_2 + SIZE_PI;
        let frontEllipseEnd = SIZE_PI_DIV_2;

        //
        let ellipseWideLineWidth =  this.size / 2;
        let ellipseTintLineWidth = (ellipseWideLineWidth / 2) * this.tintLineSizeK;

        let backEllipseWideLineWidth = (ellipseWideLineWidth > 2) ? ellipseWideLineWidth - 1 : ellipseWideLineWidth;
        let backEllipseTintLineWidth = (backEllipseWideLineWidth / 2) * this.tintLineSizeK;

        let frontEllipseWideLineWidth = (ellipseWideLineWidth > 4) ? ellipseWideLineWidth + 1 : ellipseWideLineWidth;
        let frontEllipseTintLineWidth = (frontEllipseWideLineWidth / 2) * this.tintLineSizeK;

        let red = `rgba(255, 0, 0, ${this.ellipseOpacity})`;
        let yellow = `rgba(255, 255, 0, ${this.tintLineOpcity})`;

        // DRAW

        // BACK LINES
        // wide
        this.drawElipse(ellipseSizeX, ellipseSizeY, backEllipseStart, backEllipseEnd, red, backEllipseWideLineWidth);
        // tint
        this.drawElipse(ellipseSizeX, ellipseSizeY, backEllipseStart, backEllipseEnd, yellow, backEllipseTintLineWidth);
        
        // BLACK HOLE
        ctx.shadowColor = 'rgb(200, 0, 200)';
        ctx.shadowBlur = this.size;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, SIZE_2PI, false);
        ctx.fillStyle = `rgb(0, 0, 0)`;
        ctx.fill();

        ctx.shadowColor = 'rgba(0, 0, 0, 0)';

        // color mask
        if (this.colorOpacity > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, SIZE_2PI, false);
            ctx.fillStyle = `rgba${this.color}, ${this.colorOpacity})`;
            ctx.fill();

            this.colorOpacity -= this.colorOpacitySub;
        }

        // MID LINES
        // wide
        this.drawCircle(ellipseSizeY, red, ellipseWideLineWidth);
        // tint
        this.drawCircle(ellipseSizeY, yellow, ellipseTintLineWidth);

        // FRONT LINE
        // wide
        this.drawElipse(ellipseSizeX, ellipseSizeY, frontEllipseStart, frontEllipseEnd, red, frontEllipseWideLineWidth);
        // tint
        this.drawElipse(ellipseSizeX, ellipseSizeY, frontEllipseStart, frontEllipseEnd, yellow, frontEllipseTintLineWidth);

        // TEXT
        let text1 = `BLACK HOLE`;
        let text2 = `W: ${Math.ceil(this.weight)}; r: ${Math.round(this.size)}`;
        let text3 = `E: ${Math.ceil(this.energy)}`;
        ctx.fillStyle = '#00ff00';
        ctx.fillText  (text1, this.x + this.size + 5, this.y - this.size);
        ctx.fillText  (text2, this.x + this.size + 5, this.y - this.size + 26);
        ctx.fillText  (text3, this.x + this.size + 5, this.y - this.size + 52);

        if (this.colorOpacity <= 0) this.updateEllipces();

        // MOVE
        this.x += this.stepX;
        this.y += this.stepY;

        // CHECK OUTSIDE
        if (this.x + this.size * 2 + this.stepX < -outside
        || this.x - this.size * 2 - this.stepX > vw + outside
        || this.y + this.size * 2 + this.stepY < -outside
        || this.y - this.size * 2 - this.stepY > vh + outside)
        {
            this.isExist = false;
        } else {
            this.size = Math.sqrt(this.weight);
            this.angle += this.angleAdd;

            if (this.energy > this.size) this.energy -= this.size;
            else if (this.weight > 1) this.weight -= Math.sqrt(this.size);
            else this.isExist = false;
        }
    }

    drawElipse(sizeX, sizeY, start, end, color, lineWidth) {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, sizeX, sizeY, this.angle, start, end);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    drawCircle(size, color, lineWidth) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, SIZE_2PI, false);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    updateEllipces() {
        if (this.ellipseOpacity < 0.6) this.ellipseOpacity += this.ellipseOpacitySub;

        if (this.isRiseTintLineOpcity) {
            this.tintLineOpcity += this.tintLineStep;
            if (this.tintLineOpcity > 0.5) this.isRiseTintLineOpcity = false;
        } else {
            this.tintLineOpcity -= this.tintLineStep;
            if (this.tintLineOpcity < 0.4) this.isRiseTintLineOpcity = true;
        }

        if (this.isRiseTintLineSizeK) {
            this.tintLineSizeK += this.tintLineStep;
            if (this.tintLineSizeK > 1.2) this.isRiseTintLineSizeK = false;
        } else {
            this.tintLineSizeK -= this.tintLineStep;
            if (this.tintLineSizeK < 0.6) this.isRiseTintLineSizeK = true;
        }
        
    }

    getColor() {
        if (this.colorOpacity > 0) return `rgb${this.color})`;
        return `rgb(0, 0, 0)`;
    }

    confluence(weight, energy) {
        this.weight += weight;
        this.energy += energy;  
    }

    getGravity(x, y, weight, distance) {
        let dx = this.x - x;
        let dy = this.y - y;
        let G = weight / (distance * distance);
        this.stepX -= (dx * G) / 10000;
        this.stepY -= (dy * G) / 10000;
    }

}

class FadeStars {
    constructor (x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color.slice(3, -1); // '(0, 255, 255'
        this.colorOpacity = 1;
        this.colorOpacitySub = 0.01;

        this.isExist = true;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, SIZE_2PI, false);
        ctx.fillStyle = `rgba${this.color}, ${this.colorOpacity})`;
        ctx.fill();

        if (this.colorOpacity > this.colorOpacitySub) this.colorOpacity -= this.colorOpacitySub;
        else this.isExist = false;
    }
}

let starsArr = [];
let fadeStarsArr = [];
let explosionsArr = [];

function checkStarsDistance() {
    for (let i = 0; i < starsArr.length - 1; i++) {
        for (let j = i+1; j < starsArr.length; j++) {
            let distance = getDistance(starsArr[i].x, starsArr[i].y, starsArr[j].x, starsArr[j].y);
            let biggerSize = (starsArr[i].size > starsArr[j].size) ? starsArr[i].size : starsArr[j].size;
            if (distance < biggerSize) confluence(starsArr[i], starsArr[j]);
            else {
                starsArr[i].getGravity(starsArr[j].x, starsArr[j].y, starsArr[j].weight, distance);
                starsArr[j].getGravity(starsArr[i].x, starsArr[i].y, starsArr[i].weight, distance);
            }
        }
    }
}

function confluence(starA, starB) {
    let [bigger, smaller] = (starA.weight > starB.weight) ? [starA, starB] : [starB, starA];
    bigger.confluence(smaller.weight, smaller.energy);
    smaller.isExist = false;
    if (bigger.isBlackHole) {
        fadeStarsArr.push( new FadeStars(smaller.x, smaller.y, smaller.size, smaller.getColor()) );
    } else {
        let expW = smaller.weight * 0.5;
        explosionsArr.push( new Explosion(smaller.x, smaller.y, expW, Math.sqrt( expW )) );
    }
}

// ANIMATION
function animate() {
    ctx.clearRect(0, 0, vw, vh);
    ctx.drawImage(background, bgX, bgY, bgW, bgH, 0, 0, vw, vh);

    starsArr.forEach( star => star.draw() );
    fadeStarsArr.forEach( fadeStar => fadeStar.draw() );
    explosionsArr.forEach( exp => exp.draw() );
    
    checkStarsDistance();

    fadeStarsArr = fadeStarsArr.filter(fadeStar => fadeStar.isExist);
    explosionsArr = explosionsArr.filter(exp => exp.isExist);
    starsArr = starsArr.filter(star => star.isExist);

    if (newStarSizeDilay > 0) {
        newStarSizeDilay--;
        // TEXT
        ctx.fillStyle = '#00ff00';
        ctx.fillText  (`NEW STAR SIZE = ${newStarSize}`, 5, 5);
    }

    if (starsArr.length < maxStars) starsArr.push( new Star() );

    requestAnimationFrame(animate);
}

background.onload = function(){
    animate();
}