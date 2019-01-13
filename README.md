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

## Usage

The main part of the library comes down to the `AsciiEngine` class. Documentation will come soon :).
