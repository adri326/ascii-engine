class AsciiEngine {
  constructor(canvas, tileSize, tileSizeX = tileSize) {
    if (typeof canvas === "object") {
      this.canvas = canvas;
    }
    else if (typeof canvas === "string") {
      let element = document.querySelector(canvas);
      if (!element) throw new Error(`Coudln't find canvas element '${canvas}'!`);
      this.canvas = element;
    }
    else throw new Error("Invalid input for AsciiEngine::new");

    this.ctx = this.canvas.getContext("2d");

    this.fixedSize = false;
    this.tileSize = tileSize;
    this.tileSizeX = tileSizeX;
    this.backgroundColor = [0, 0, 0, 1];
    this.foregroundColor = [255, 255, 255, 1];
    this.ctx.textAlign = "left";
    this.ctx.font = `${tileSize}px LCD`;
    this.replaceFullBlock = true;

    this.updateResolution();
  }

  updateResolution() {
    this.fixedSize = false;
    this.canvas.width = Math.round(this.canvas.clientWidth / this.tileSizeX) * this.tileSizeX;
    this.canvas.height = Math.round(this.canvas.clientHeight / this.tileSize) * this.tileSize;
    this.width = Math.floor(this.canvas.width / this.tileSizeX);
    this.height = Math.floor(this.canvas.height / this.tileSize);
  }

  font(name, style = "") {
    this.ctx.font = `${style} ${this.tileSize}px ${name}`;
  }

  size(width, height, match = false) {
    this.fixedSize = true;
    this.width = width;
    this.height = height;
    if (match) { // match tile size to the canvas dimensions
      let ratio = this.tileSizeX / this.tileSize;
      this.tileSize = Math.min(this.canvas.clientWidth / width / ratio, this.canvas.clientHeight / height);
      this.tileSizeX = this.tileSize * ratio;
    }
    this.canvas.width = this.tileSizeX * this.width;
    this.canvas.height = this.tileSize * this.height;
  }

  css() {
    this.canvas.style.objectFit = "contain";
    this.canvas.style.imageRendering = "crisp-edges";
    this.canvas.style.imageRendering = "pixelated";
    this.canvas.style.background = "black";
  }

  background(r, g, b, a = 1) {
    if (typeof g === "undefined") { // only one argument given, treat as being a monochromatic value
      this.backgroundColor = [r, r, r, 1];
    }
    else {
      this.backgroundColor = [r, g, b, a];
    }
  }

  foreground(r, g, b, a = 1) {
    if (typeof g === "undefined") {
      this.foregroundColor = [r, r, r, 1];
    }
    else {
      this.foregroundColor = [r, g, b, a];
    }
  }

  print(char, x, y) {
    // background
    this.ctx.fillStyle = `rgba(${this.backgroundColor.join(",")})`;
    this.ctx.fillRect(x * this.tileSizeX, y * this.tileSize, this.tileSizeX * char.length, this.tileSize);
    // foreground
    this.ctx.fillStyle = `rgba(${this.foregroundColor.join(",")})`;
    for (let n = 0; n < char.length; n++) {
      if (char[n] === AsciiEngine.FULL_BLOCK && this.replaceFullBlock) {
        this.ctx.fillRect((x + n) * this.tileSizeX, y * this.tileSize, this.tileSizeX, this.tileSize);
      }
      else if (char[n] !== AsciiEngine.SPACE) {
        this.ctx.fillText(char[n], (x + n) * this.tileSizeX, (y + 1) * this.tileSize);
      }
    }
  }

  printBoxed(text, x, y, width, height = this.height - y, nChar = Infinity) {
    let o = 0;
    let split = this.split(text, width);
    for (let n = 0; n < split.length && n < height && o < nChar; n++) {
      if (o + split[n].length <= nChar) {
        this.print(split[n], x, y+n);
      }
      else {
        this.print(split[n].slice(0, nChar - o - split[n].length), x, y+n);
      }
      o += split[n].length;
    }
  }

  split(text, width) {
    if (text.length < width) return [text];
    let res = [""];
    let split = text.replace(AsciiEngine.SEPARATOR_REGEXP, "$1\uea01").split(/\uea01/g); // firefox does not support lookbehinds; we are using a private area in the unicode range
    let length = 0;
    let current = 0;
    for (let string of split) {
      if (length + string.length <= width) {
        length += string.length;
        res[current] += string;
      }
      else {
        res[++current] = string;
        length = string.length;
      }
    }
    return res;
  }

  fill(char) {
    if (char === AsciiEngine.SPACE) {
      this.ctx.fillStyle = `rgba(${this.backgroundColor.join(",")})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    else if (char === AsciiEngine.FULL_BLOCK) {
      this.ctx.fillStyle = `rgba(${this.foregroundColor.join(",")})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    else {
      for (let y = 0; y < this.height; y++) {
        ae.print(char.repeat(this.width), 0, y);
      }
    }
  }
}

AsciiEngine.Builder = class AsciiEngineBuilder {
  constructor(...args) {
    this.ae = new AsciiEngine(...args);
  }

  size(...args) {
    this.ae.size(...args);
    return this;
  }

  font(name) {
    this.ae.font(name);
    return this;
  }

  css() {
    this.ae.css();
    return this;
  }

  build() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.ae);
      }, 100);
    });
  }
}

AsciiEngine.Box = class Box {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  border(style) {
    this.style = style;
  }

  printBorder(parent) {
    if (typeof this.style === "string") {
      if (this.style.length === 1) {
        let horizontal = this.style.repeat(this.width);
        parent.print(horizontal, this.x, this.y);
        parent.print(horizontal, this.x, this.y + this.height - 1);
        for (let y = this.y + 1; y < this.y + this.height - 1; y++) {
          parent.print(this.style, this.x, y);
          parent.print(this.style, this.x + this.width - 1, y);
        }
        return;
      }
    }
    for (let x = this.x; x < this.x + this.width; x++) {
      parent.print(this.getBorder(x, this.y), x, this.y);
      parent.print(this.getBorder(x, this.y + this.height - 1), x, this.y + this.height - 1);
    }
    for (let y = this.y + 1; y < this.y + this.height - 1; y++) {
      parent.print(this.getBorder(this.x, y), this.x, y);
      parent.print(this.getBorder(this.x + this.width - 1, y), this.x + this.width - 1, y);
    }
  }

  getBorder(x, y) {
    if (typeof this.style === "object") {
      if (x === this.x) {
        if (y === this.y) {
          return this.style.topleft || this.style.corner || this.style.default || " ";
        }
        if (y === this.y + this.height - 1) {
          return this.style.bottomleft || this.style.corner || this.style.default || " ";
        }
        return this.style.left || this.style.default || " ";
      }
      if (x === this.x + this.width - 1) {
        if (y === this.y) {
          return this.style.topright || this.style.corner || this.style.default || " ";
        }
        if (y === this.y + this.height - 1) {
          return this.style.bottomright || this.style.corner || this.style.default || " ";
        }
        return this.style.right || this.style.default || " ";
      }
      if (y === this.y) return this.style.top || this.style.default || " ";
      if (y === this.y + this.height - 1) return this.style.bottom || this.style.default || " ";
    }

    return "";
  }
}

AsciiEngine.FULL_BLOCK = "█";
AsciiEngine.SHADE_1 = "░";
AsciiEngine.SHADE_2 = "▒";
AsciiEngine.SHADE_3 = "▓";
AsciiEngine.SPACE = " ";
AsciiEngine.UPPER_HALF_BLOCK = "▀";
AsciiEngine.LOWER_HALF_BLOCK = "▄";
AsciiEngine.BORDER_HORIZONTAL = "─";
AsciiEngine.DBORDER_HORIZONTAL = "═";
AsciiEngine.BORDER_VERTICAL = "│";
AsciiEngine.DBORDER_VERTICAL = "║";
AsciiEngine.CORNER_TOPLEFT = "┌";
AsciiEngine.CORNER_TOPRIGHT = "┐";
AsciiEngine.CORNER_BOTTOMLEFT = "└";
AsciiEngine.CORNER_BOTTOMRIGHT = "┘";
AsciiEngine.DCORNER_TOPLEFT = "╔";
AsciiEngine.DCORNER_TOPRIGHT = "╗";
AsciiEngine.DCORNER_BOTTOMLEFT = "╚";
AsciiEngine.DCORNER_BOTTOMRIGHT = "╝";
AsciiEngine.SEPARATOR_REGEXP = /([ ,\-;:])/g;
