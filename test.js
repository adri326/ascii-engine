let ae;
let builder = new AsciiEngine.Builder("#canvas", 16, 16)
  .size(60, 30)
  .font("ATIFont")
  .css()
  .build()
  .then((res) => {
    ae = res;
    init();
  });

const TEXT = "Hey there! I am the sample text!" + AsciiEngine.BORDER_HORIZONTAL + AsciiEngine.DBORDER_HORIZONTAL + AsciiEngine.DBORDER_VERTICAL + "%+,.?@#$^&~";
let timeStart = performance.now();
let box;

function init() {
  ae.replaceFullBlock = false;
  box = new AsciiEngine.Box(2, 4, ae.width - 4, ae.height - 9);
  box.border({
    top: AsciiEngine.DBORDER_HORIZONTAL,
    bottom: AsciiEngine.DBORDER_HORIZONTAL,
    left: AsciiEngine.DBORDER_VERTICAL,
    right: AsciiEngine.DBORDER_VERTICAL,
    topleft: AsciiEngine.DCORNER_TOPLEFT,
    topright: AsciiEngine.DCORNER_TOPRIGHT,
    bottomleft: AsciiEngine.DCORNER_BOTTOMLEFT,
    bottomright: AsciiEngine.DCORNER_BOTTOMRIGHT,
    corner: "#"
  });
  draw();
}

function draw() {
  ae.background(16, 32, 64);
  ae.foreground(255, 125, 158);
  ae.fill(AsciiEngine.SPACE);
  box.printBorder(ae);
  ae.foreground(245, 255, 245);
  ae.printBoxed(TEXT, 4, 6, ae.width - 8, ae.height - 13, Math.floor((performance.now() - timeStart) / 50));
  requestAnimationFrame(draw);
}
