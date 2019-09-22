let ae;
let builder = new AsciiEngine.Builder("#canvas", 16, 16)
  .lineHeight(18)
  .size(45, 30)
  .font("ATIFont")
  .css()
  .build()
  .then((res) => {
    ae = res;
    init();
  });

let timeStart;
let box;
let textToDisplay = "";

let necklace = new Necklace();


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
  box.border("*-*| |*-*");
  box.padding(2);

  let pages = [necklace.createPage("Hey there! Welcome to this demo of AsciiEngine!")];
  necklace.setFirstPage(pages[0]);
  pages.push(necklace.createPage("As you can see, this demo does support user input :3"));
  pages.push(necklace.createPage("I think you've hit an end."));
  pages.push(necklace.createPage("You won't have the choice anyway."));
  pages.push(necklace.createPage("Last page, there's only the way back now!"));
  pages.push(necklace.createPage("Forgot this one page, but now it's the very last one, nothing else up for you!"));
  necklace.createString(pages[0], pages[1], "1", "Next page");
  necklace.createString(pages[0], pages[2], "2", "Jump to the end");

  // user input :3
  necklace.createString(pages[1], pages[2], "1", "Next page");

  // end
  necklace.createString(pages[2], pages[0], "1", "Back to the first page");
  necklace.createString(pages[2], pages[3], "2", "I don't care");

  // no choice
  necklace.createString(pages[3], pages[0], "1", "Back to the first page!");
  necklace.createString(pages[3], pages[4], "2", "Didn't listen");

  // only way back
  necklace.createString(pages[4], pages[0], "1", "Go back!!");
  necklace.createString(pages[4], pages[0], "2", "Go back!!");
  necklace.createString(pages[4], pages[5], "3", "Go back!!!");

  // forgot this one
  necklace.createString(pages[5], pages[0], "1", "The end.");

  let user = necklace.createUser({name: "Demo User"});
  let current = user.getCurrentPage();
  currentPage = current;
  let strings = current.getAvailableStrings();

  ae.on("keydown", (evt) => {
    let string = strings.find((str) => str.name === evt.key);
    if (string) {
      user.select(string, evt.key);
      timeStart = performance.now();
      current = user.getCurrentPage();
      strings = current.getAvailableStrings();
      textToDisplay = renderPage(current, strings);
    }
  });

  ae.on("mousemove", (evt) => {
    cursorPosition = ae.getCoordinate(evt.x, evt.y);
  });

  textToDisplay = renderPage(current, strings);
  timeStart = performance.now();

  draw();
}

let cursorPosition = [0, 0];
let currentPage;

function draw() {
  ae.background(16, 32, 64);
  ae.foreground(255, 125, 158);
  ae.fill(AsciiEngine.SPACE);

  box.printBorder(ae);
  ae.foreground(245, 255, 245);
  box.printText(ae, textToDisplay, Math.floor((performance.now() - timeStart) / 25));

  ae.background(255, 255, 255);
  ae.foreground(0, 0, 0);
  ae.print(ae.getCharAt(...cursorPosition), ...cursorPosition);

  requestAnimationFrame(draw);
}

function renderPage(page, strings = page.getAvailableStrings()) {
  let res = [page.content, "\n"];

  for (let string of strings) {
    res.push(new ClickableString(`\n [${string.name}]: ${string.content}`));
  }

  return res;
}

class ClickableString extends AsciiEngine.TextComponent {
  draw(engine, x, y, width = Infinity, height = Infinity) {
    let myHeight = engine.split(this.text, width);
    let myWidth = myHeight.reduce((acc, act) => Math.max(acc, act.length), 0);

    if (cursorPosition[1] > y && cursorPosition[1] < y + myHeight.length && cursorPosition[0] > x && cursorPosition[0] < x + myWidth) {
      engine.foreground(255, 125, 158);
    } else {
      engine.foreground(220);
    }

    return AsciiEngine.TextComponent._draw(this, engine, x, y, width, height);
  }
}
