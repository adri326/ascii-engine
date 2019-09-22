class AsciiEngine {
  /*!
  * Creates a new AsciiEngine instance; canvas may be an object or a querySelector
  */
  constructor(canvas, tileSize, tileSizeX = tileSize) {
    if (typeof canvas === "object") {
      this.canvas = canvas;
    } else if (typeof canvas === "string") {
      let element = document.querySelector(canvas);
      if (!element) throw new Error(`Coudln't find canvas element '${canvas}'!`);
      this.canvas = element;
    } else throw new Error("Invalid input for AsciiEngine::new");

    this.ctx = this.canvas.getContext("2d");

    this.fixedSize = false;
    this.tileSize = tileSize;
    this.tileSizeX = tileSizeX;
    this.lh = tileSize;
    this.backgroundColor = [0, 0, 0, 1];
    this.foregroundColor = [255, 255, 255, 1];
    this.ctx.textAlign = "left";
    this.ctx.font = `${tileSize}px LCD`;
    this.replaceFullBlock = true;

    this.eventHandlers = [];
    this.keysDown = {};

    window.addEventListener("keydown", this._onkeydown.bind(this));
    window.addEventListener("keyup", this._onkeyup.bind(this));

    this.canvas.addEventListener("mousedown", this._onmousedown.bind(this));
    this.canvas.addEventListener("mouseup", this._onmouseup.bind(this));
    this.canvas.addEventListener("mousemove", this._onmousemove.bind(this));
    this.canvas.addEventListener("blur", this._onblur.bind(this));

    this.updateResolution();
  }

  /*!
  * Updates the internal canvas' width and height; the "text canvas" will scale accordingly
  */
  updateResolution() {
    this.fixedSize = false;
    this.canvas.width = Math.round(this.canvas.clientWidth / this.tileSizeX) * this.tileSizeX;
    this.canvas.height = Math.round(this.canvas.clientHeight / this.lh) * this.lh;
    this.width = Math.floor(this.canvas.width / this.tileSizeX);
    this.height = Math.floor(this.canvas.height / this.lh);

    this.chars = (new Array(this.height)).fill(true).map(x => new Array(this.width).fill(""));
  }

  /*!
  * Sets the font to use
  */
  font(name, style = "") {
    this.ctx.font = `${style} ${this.tileSize}px ${name}`;
  }

  /*!
  * Sets the resolution of the canvas, also matching the tile size if specified
  */
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
    this.canvas.height = this.lh * this.height;

    this.chars = (new Array(this.height)).fill(true).map(x => new Array(this.width).fill(""));
  }

  /*!
  * Sets the line height
  */
  lineHeight(lineHeight) {
    this.lh = lineHeight;
  }

  /*!
  * Gives the canvas element the proper CSS properties
  */
  css() {
    this.canvas.style.objectFit = "contain";
    this.canvas.style.imageRendering = "crisp-edges";
    this.canvas.style.imageRendering = "pixelated";
    this.canvas.style.background = "black";
  }

  /*!
  * Sets the background color for the text to be drawn; if only one argument is given, treat it as being a monochromatic value
  */
  background(r, g, b, a = 1) {
    if (typeof g === "undefined") { // only one argument given, treat as being a monochromatic value
      this.backgroundColor = [r, r, r, 1];
    } else {
      this.backgroundColor = [r, g, b, a];
    }
  }

  /*!
  * Sets the foreground color for the text to be drawn, similar to AsciiEngine::background()
  */
  foreground(r, g, b, a = 1) {
    if (typeof g === "undefined") {
      this.foregroundColor = [r, r, r, 1];
    } else {
      this.foregroundColor = [r, g, b, a];
    }
  }

  /*!
  * Prints a string at a given location
  */
  print(text, x, y) {
    // background
    this.ctx.fillStyle = `rgba(${this.backgroundColor.join(",")})`;
    this.ctx.fillRect(x * this.tileSizeX, y * this.lh, this.tileSizeX * text.length, this.lh);
    // foreground
    this.ctx.fillStyle = `rgba(${this.foregroundColor.join(",")})`;
    for (let n = 0; n < text.length; n++) {
      if (text[n] === AsciiEngine.FULL_BLOCK && this.replaceFullBlock) {
        this.ctx.fillRect((x + n) * this.tileSizeX, y * this.lh, this.tileSizeX, this.lh);
      } else if (text[n] !== AsciiEngine.SPACE) {
        this.ctx.fillText(text[n], (x + n) * this.tileSizeX, y * this.lh + this.tileSize);
      }

      if (x >= 0 && x < this.width && y >= 0 && y < this.height) this.chars[y][x + n] = text[n];
    }
  }

  /*!
  * Prints text in a "box": it will soft-wrap to not overflow; returns whether or not everything could be drawn
  */
  printBoxed(text, x, y, width, height = this.height - y, nChar = Infinity) {
    let o = 0;
    let split = this.split(text, width);
    for (let n = 0; n < split.length && n < height && o < nChar; n++) {
      if (o + split[n].length <= nChar) {
        this.print(split[n], x, y+n);
      } else {
        this.print(split[n].slice(0, nChar - o - split[n].length), x, y+n);
      }
      o += split[n].length;
    }

    return split.length;
  }

  /*!
  * Used by AsciiEngine::printBoxed, soft-wraps text and returns an array of what should be in each line
  */
  split(raw, width) {
    let res = [""];
    let current = 0;
    raw.split(/\n/g).forEach((text) => {
      let length = 0;
      res[++current] = "";
      if (text.length < width) {
        res[current] = text;
        return;
      }
      // firefox does not support lookbehinds; we are using a private area in the unicode range
      let split = text.replace(AsciiEngine.SEPARATOR_REGEXP, "$1\uea01").split(/\uea01/g);
      for (let string of split) {
        if (length + string.length <= width) {
          length += string.length;
          res[current] += string;
        } else {
          res[++current] = string;
          length = string.length;
        }
      }
    });

    return res.slice(1);
  }

  /*!
  * Fills the whole canvas with one character
  */
  fill(char) {
    if (char === AsciiEngine.SPACE) {
      this.filledChar = char;
      this.ctx.fillStyle = `rgba(${this.backgroundColor.join(",")})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          this.chars[y][x] = char;
        }
      }
    } else if (char === AsciiEngine.FULL_BLOCK) {
      this.filledChar = char;
      this.ctx.fillStyle = `rgba(${this.foregroundColor.join(",")})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          this.chars[y][x] = char;
        }
      }
    } else {
      for (let y = 0; y < this.height; y++) {
        ae.print(char.repeat(this.width), 0, y);
      }
    }
  }

  /*!
  * Register an eventHandler
  */
  on(evt, handler) {
    if (typeof handler === "function") {
      this.eventHandlers.push([evt, handler]);
    }
    else {
      throw new Error("Invalid type for AsciiEngine::on(eventName, handler), should be a function");
    }
  }

  /*!
  * Dispatches an event
  */
  dispatchEvent(name, evt) {
    for (let [_name, handler] of this.eventHandlers) {
      if (_name === name) handler(evt);
    }
  }

  /*!
  * Returns a pair of coordinates, representing which character is below it. If invalid, returns [-1, -1]
  */
  getCoordinate(x, y) {
    let _x = Math.floor(x / this.tileSizeX);
    let _y = Math.floor(y / this.lh);
    if (_x < 0 || _x >= this.width || _y < 0 || _y >= this.height) {
      return [-1, -1];
    }
    return [_x, _y];
  }

  getCharAt(x, y) {
    if (isNaN(+x) || isNaN(+y)) return "";
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return "";

    return this.chars[y][x];
  }

  /*!
  * Internal handlers for key presses
  */
  _onkeydown(evt) {
    this.keysDown[evt.code] = true;
    this.dispatchEvent("keydown", evt);
  }

  _onkeyup(evt) {
    this.keysDown[evt.code] = false;
    this.dispatchEvent("keyup", evt);
  }

  _onmousedown(evt) {
    let x = evt.clientX - this.canvas.offsetLeft;
    let y = evt.clientY - this.canvas.offsetTop;
    this.mouseDown = true;
    this.dispatchEvent("mousedown", {x, y, ...evt});
  }

  _onmouseup(evt) {
    let x = evt.clientX - this.canvas.offsetLeft;
    let y = evt.clientY - this.canvas.offsetTop;
    this.mouseDown = false;
    this.dispatchEvent("mouseup", {x, y, ...evt});
  }

  _onmousemove(evt) {
    let x = evt.clientX - this.canvas.offsetLeft;
    let y = evt.clientY - this.canvas.offsetTop;
    this.dispatchEvent("mousemove", {x, y, ...evt});
  }

  _onblur(evt) {
    this.mouseDown = false;
    this.dispatchEvent("blur", evt);
  }
}

/*!
* A builder class for the AsciiEngine class
*/
AsciiEngine.Builder = class Builder {
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

  lineHeight(lineHeight) {
    this.ae.lineHeight(lineHeight);
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

/*
* A box class; use it to place bits of text on the screen that you don't want to overflow.
* It may have borders and padding, if you wish to.
* The - to my extend - most important thing about it is that you can feed it a mixed array of `TextComponent`s and strings, which it will print without them overlapping
*/
AsciiEngine.Box = class Box {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.pad = 0;
  }

  border(style) {
    if (typeof this.style === "string") {
      this.style = style.replace(/\n/g, "");
    } else {
      this.style = style;
    }
  }

  padding(pad) {
    this.pad = pad;
  }

  printBorder(parent) {
    if (!this.style) return; // no border specified

    if (typeof this.style === "string") {
      if (this.style.length === 1) {
        let horizontal = this.style.repeat(this.width);

        parent.print(horizontal, this.x, this.y);
        parent.print(horizontal, this.x, this.y + this.height - 1);

        for (let y = this.y + 1; y < this.y + this.height - 1; y++) {
          parent.print(this.style, this.x, y);
          parent.print(this.style, this.x + this.width - 1, y);
        }
      }
    } else {
      for (let x = this.x; x < this.x + this.width; x++) {
        parent.print(this.getBorder(x, this.y), x, this.y);
        parent.print(this.getBorder(x, this.y + this.height - 1), x, this.y + this.height - 1);
      }

      for (let y = this.y + 1; y < this.y + this.height - 1; y++) {
        parent.print(this.getBorder(this.x, y), this.x, y);
        parent.print(this.getBorder(this.x + this.width - 1, y), this.x + this.width - 1, y);
      }
    }
  }

  printText(parent, text, nChar = Infinity) {
    if (this.pad * 2 + 2 >= this.width || this.pad * 2 + 2 >= this.height) return;

    if (Array.isArray(text)) {
      let y = this.y + this.pad + 1;

      for (let n = 0; n < text.length; n++) {
        if (text[n] instanceof AsciiEngine.TextComponent) {
          y += text[n].draw(parent, this.x + this.pad + 1, y, this.width - this.pad * 2 - 2, this.height - this.pad - 1 - y);
        } else {
          y += parent.printBoxed(text[n], this.x + this.pad + 1, y, this.width - this.pad * 2 - 2, this.height - this.pad - 1 - y);
        }
      }
    } else {
      parent.printBoxed(text, this.x + this.pad + 1, this.y + this.pad + 1, this.width - this.pad * 2 - 2, this.height - this.pad * 2 - 2, nChar);
    }
  }

  getBorder(x, y) {
    let pos;
    if (x === this.x) {
      if (y === this.y) {
        pos = "topleft";
      } else if (y === this.y + this.height - 1) {
        pos = "bottomleft";
      } else {
        pos = "left";
      }
    } else if (x === this.x + this.width - 1) {
      if (y === this.y) {
        pos = "topright";
      } else if (y === this.y + this.height - 1) {
        pos = "bottomright";
      } else {
        pos = "right";
      }
    } else if (y === this.y) {
      pos = "top";
    } else if (y === this.y + this.height - 1) {
      pos = "bottom";
    }

    if (typeof this.style === "object") {
      switch (pos) {
        case "topleft": return this.style.topleft || this.style.corner || this.style.default || " ";
        case "bottomleft": return this.style.bottomleft || this.style.corner || this.style.default || " ";
        case "left": return this.style.left || this.style.default || " ";
        case "topright": return this.style.topright || this.style.corner || this.style.default || " ";
        case "bottomright": return this.style.bottomright || this.style.corner || this.style.default || " ";
        case "right": return this.style.right || this.style.default || " ";
        case "top": return this.style.top || this.style.default || " ";
        case "bottom": return this.style.bottom || this.style.default || " ";
      }
    } else if (typeof this.style === "string") {
      if (this.style.length === 1) return this.style;
      if (this.style.length === 9) { // 3x3
        switch (pos) {
          case "topleft": return this.style.charAt(0);
          case "top": return this.style.charAt(1);
          case "topright": return this.style.charAt(2);
          case "left": return this.style.charAt(3);
          case "right": return this.style.charAt(5);
          case "bottomleft": return this.style.charAt(6);
          case "bottom": return this.style.charAt(7);
          case "bottomright": return this.style.charAt(8);
        }
      }
    }

    return "";
  }
}

/*!
* A more interactive kind of string, which can have customized behavior once you display it
*/
AsciiEngine.TextComponent = class TextComponent {
  constructor(text) {
    this.text = text;
  }

  draw(engine, x, y, width, height) {
    return AsciiEngine.TextComponent._draw(this, x, y, width, height);
  }

  static _draw(instance, engine, x, y, width = Infinity, height = Infinity) {
    return engine.printBoxed(instance.text, x, y, width, height);
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

AsciiEngine.CHARLIST = [];

// These are all characters that are invisible
for (let i = 0; i < 32; i++) AsciiEngine.CHARLIST.push("");
for (let i = 32; i < 127; i++) AsciiEngine.CHARLIST.push(String.fromCharCode(i));
AsciiEngine.CHARLIST.push(""); // 127: DEL

// Similar to https://theasciicode.com.ar/extended-ascii-code/multiplication-sign-ascii-code-158.html
AsciiEngine.CHARLIST = AsciiEngine.CHARLIST.concat([
  "Ç", "ü", "é", "â", "ä", "à", "å", "ç",
  "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å",
  "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù",
  "ÿ", "Ö", "Ü", "ø", "£", "Ø", "×", "ƒ",
  "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º",
  "¿", "Ⓡ", "¬", "½", "¼", "¡", "«", "»",
  "░", "▒", "▓", "│", "┤", "Á", "Â", "À",
  "Ⓒ", "╣", "║", "╗", "╝", "¢", "¥", "┐",
  "└", "┴", "┬", "├", "─", "┼", "ã", "Ã",
  "╚", "╔", "╩", "╦", "╠", "═", "╬", "¤",
  "ð", "Ð", "Ê", "Ë", "È", "ı", "Í", "Î",
  "Ï", "┘", "┌", "█", "▄", "¦", "Ì", "▀",
  "Ó", "ß", "Ô", "Ò", "õ", "Õ", "μ", "þ",
  "Þ", "Ú", "Û", "Ù", "ý", "Ý", "¯", "´",
  "≡", "±", "‗", "¾", "¶", "§", "÷", "¸",
  "°", "¨", "·", "¹", "³", "²", "■", " "
]);
