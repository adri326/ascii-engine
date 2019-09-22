# ascii-engine

I grew up with a 16-color text editor in a 640x480 screen resolution, and my main way to draw graphisms was by drawing individual characters.
This library attempts to bring this concept back to life, for me to probably reproduce my old projects with it.

## Installation

You just need to load the script off github.io:

```html
<html>
  <head>
    <script src="https://adri326.github.io/ascii-engine/index.js"></script>
    <script defer>
      let ae = new AsciiEngine("#canvas", 16, 8);
      setTimeout(() => {
        ae.print("Hey!", 0, 0);
      }, 100);
    </script>
  </head>
  <body>
    <canvas id="canvas"></canvas>
  </body>
</html>
```

## Installation and usage

Clone this repository by running

```sh
git clone https://github.com/adri326/ascii-engine
```

If you wish to see the example program in action, then you will also need to fetch two additional dependencies:

```sh
git submodule update --init
```

The root of this library is the `AsciiEngine` class.
Other classes that may come handy (`Box`, `Builder`, `TextComponent`) are contained within it (`AsciiEngine.Box`, `AsciiEngine.Builder`, `AsciiEngine.TextComponent`).
