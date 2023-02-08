'use strict';

const SIZE_2PI = Math.PI * 2;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

document.body.prepend(canvas);

var background = new Image();
background.src = "./src/images/space-bg.jpg";
background.width = 3840;
background.height = 2400;

let vw, vh, vcx, vcy, bgX, bgY, bgW, bgH, outside, maxStars;

window.addEventListener('resize', updateSizes);
function updateSizes() {
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    canvas.width = vw = window.innerWidth * 2;
    canvas.height = vh = window.innerHeight * 2;

    vcx = Math.floor(vw / 2);
    vcy = Math.floor(vh / 2);

    ctx.font = '24px Roboto-Regular, Arial, sans-serif';
    ctx.fillStyle = '#00ff00';
    ctx.textBaseline = 'top';

    let k_w = background.width / window.innerWidth;  // 3840/360 = 10.67
    let k_h = background.height / window.innerHeight; // 2400/720 = 3,33
    let k = k_w < k_h ? k_w : k_h;    // 3,33
    bgW = Math.floor(window.innerWidth * k);         // 1198
    bgH = Math.floor(window.innerHeight * k);         // 2397
    bgX = Math.floor((background.width - bgW) / 2);
    bgY = Math.floor((background.height - bgH) / 2);

    outside = (vw > vh) ? Math.floor(vw / 4) : Math.floor(vh / 4);

    maxStars = Math.ceil( window.innerWidth * window.innerHeight / 1000 );
    //maxStars = 1;
}
updateSizes();

function getDistance (x1, y1, x2, y2) {
    return Math.sqrt( Math.pow( (x1 - x2), 2) + Math.pow( (y1 - y2), 2) );
}

class Star {

    constructor(x, y) {
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

        this.fuelWeight = 2 + Math.ceil( Math.random() * 5 ); // 2...5
        this.usedWeight = 0 + Math.ceil( Math.random() * 3 ); // 1...3
        this.weight = this.fuelWeight + this.usedWeight; // 3...10
        this.size = Math.sqrt(this.weight); // w=1 -> s=1; w=5 -> s=2.24; w=10 -> s=3.16;
        this.temperature = Math.ceil(Math.random() * 765); // w=1 -> s=1; w=5 -> s=2.24; w=10 -> s=3.16;
        this.energy = Math.sqrt( this.weight ** this.size );
        this.expend = Math.sqrt(this.size) / 10;

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
            let text1 = `F: ${Math.ceil(this.fuelWeight)} (exp.: ${(this.expend).toFixed(3)} )`;
            let text2 = `E: ${Math.ceil(this.energy)}; t: ${Math.round(this.temperature)};`;
            let text3 = `W: ${Math.ceil(this.weight)}; r: ${Math.round(this.size)}`;
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
        } else {
        // RECALCULATE AND BURN
            this.weight = this.fuelWeight + this.usedWeight;
            this.size = Math.sqrt(this.weight);
            this.expend = Math.sqrt(this.size) / 10;

            if (this.fuelWeight > 0) this.burn();

            this.updateTemperature();
        }
    }

    burn() {
        let fuel = (this.expend > this.fuelWeight) ? this.fuelWeight : this.expend;
        this.fuelWeight -= fuel;
        this.usedWeight += fuel;
        this.energy += fuel / 2;
    }

    updateTemperature() {
        if (this.energy >= this.expend) {
            this.energy -= this.expend;
            this.temperature += this.expend / this.size;
        } else {
            const T = this.expend * this.size / this.weight;
            if (this.temperature >= T) this.temperature -= T;
            else {
                this.isExist = false;
                explosionsArr.push( new Explosion(this.x, this.y, this.weight, this.size) );
                // if (this.weight > 50) starsArr.push( new Star(this.x, this.y) );
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

    confluence(otherFuelWeight, otherUsedWeight, energy) {
        this.fuelWeight += otherFuelWeight;
        this.usedWeight += otherUsedWeight / 2;
        this.energy += energy / 2;  
    }

    getGravity(x, y, weight, distance) {
        let dx = this.x - x;
        let dy = this.y - y;
        let G = weight / (distance * distance);
        this.stepX -= (dx * G) / 100;
        this.stepY -= (dy * G) / 100;
    }
}

class ClickStar extends Star {
    constructor(x, y) {
        super(x, y);
    }
}

canvas.addEventListener('click', event => {
    starsArr.push(new ClickStar(event.x * 2, event.y * 2));
});

canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    let [xx, yy] = [event.x * 2, event.y * 2];
    for(let i = 0; i < starsArr.length; i++) {
        let [x1, x2] = [starsArr[i].x - starsArr[i].size, starsArr[i].x + starsArr[i].size];
        let [y1, y2] = [starsArr[i].y - starsArr[i].size, starsArr[i].y + starsArr[i].size];
        if (xx > x1 && xx < x2 && yy > y1 && yy < y2) {
            starsArr[i].energy = 0;
            starsArr[i].temperature /= 2;
            starsArr[i].usedWeight += starsArr[i].fuelWeight;
            starsArr[i].fuelWeight = 0;
            break;
        }
    }
});

class Explosion {
    constructor(x, y, weight, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.sizeStep = Math.sqrt(weight);
        this.opacity = 0.7;
        this.opacitySub = 1 / weight;
        this.line = size / 2;
        this.lineSub = 1 / size;
        this.colorG = 255;
        this.colorB = 255;

        this.isExist = true;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, SIZE_2PI, false);
        ctx.strokeStyle = `rgba(128, ${this.colorG}, ${this.colorB}, ${this.opacity.toFixed(3)})`;
        ctx.lineWidth = this.line;
        ctx.stroke(); 
        
        this.opacity -= this.opacitySub;
        
        if (this.opacity > this.opacitySub) {
            this.size += this.sizeStep;
            this.sizeStep -= Math.sqrt(this.sizeStep);
            this.line = (this.line > 1) ? this.line - this.lineSub : this.line;

            if (this.colorB > 1) this.colorB -= 2;
            if (this.colorG > 0) this.colorG--;
        } else this.isExist = false;
    }
}

let starsArr = [];
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
    bigger.confluence(smaller.fuelWeight, smaller.usedWeight, smaller.energy);
    smaller.isExist = false;
    explosionsArr.push( new Explosion(smaller.x, smaller.y, smaller.weight, smaller.size) );
}

// ANIMATION
let frame = 0;
function animate() {
    ctx.clearRect(0, 0, vw, vh);
    ctx.drawImage(background, bgX, bgY, bgW, bgH, 0, 0, vw, vh);

    starsArr.forEach( star => star.draw() );
    explosionsArr.forEach( exp => exp.draw() );
    
    checkStarsDistance();

    explosionsArr = explosionsArr.filter(exp => exp.isExist);
    starsArr = starsArr.filter(star => star.isExist);

    //if (frame % 10 === 0 && starsArr.length < maxStars) starsArr.push( new Star() );
    if (starsArr.length < maxStars) starsArr.push( new Star() );

    frame++;
    requestAnimationFrame(animate);
}

background.onload = function(){
    animate();
}