const ROWS = 8;
const COLS = 8;
const MOVES_LIMIT = 30;

const TYPES = [
  { emoji: "🍎", color: "#ff6b6b" },
  { emoji: "🍊", color: "#ffa94d" },
  { emoji: "🍋", color: "#ffd43b" },
  { emoji: "🍏", color: "#69db7c" },
  { emoji: "🍇", color: "#9775fa" },
  { emoji: "🍬", color: "#74c0fc" },
];

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const movesEl = document.getElementById("moves");
const messageEl = document.getElementById("message");
const restartBtn = document.getElementById("restart");

let board = [];       // 2D array of type index (0..5) or null
let score = 0;
let movesLeft = MOVES_LIMIT;
let selected = null;  // { r, c }
let resolving = false;

function randomType() {
  return Math.floor(Math.random() * TYPES.length);
}

// 位置 (r, c) 落呢款糖，會唔會即刻形成三連？
function createsMatch(b, r, c, type) {
  if (c >= 2 && b[r][c - 1] === type && b[r][c - 2] === type) return true;
  if (r >= 2 && b[r - 1][c] === type && b[r - 2][c] === type) return true;
  return false;
}

function createBoard() {
  // 起一個冇即時三連、而且有解嘅棋盤
  do {
    board = [];
    for (let r = 0; r < ROWS; r++) {
      board[r] = [];
      for (let c = 0; c < COLS; c++) {
        let type;
        do {
          type = randomType();
        } while (createsMatch(board, r, c, type));
        board[r][c] = type;
      }
    }
  } while (!hasValidMove());
}

function render(popping) {
  boardEl.innerHTML = "";
  const popSet = new Set((popping || []).map((p) => `${p.r},${p.c}`));

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      const type = board[r][c];
      if (type === null) {
        cell.classList.add("empty");
      } else {
        cell.textContent = TYPES[type].emoji;
        cell.style.background = TYPES[type].color;
      }

      if (popSet.has(`${r},${c}`)) cell.classList.add("pop");
      if (selected && selected.r === r && selected.c === c) cell.classList.add("selected");

      cell.addEventListener("click", () => onCellClick(r, c));
      boardEl.appendChild(cell);
    }
  }

  scoreEl.textContent = score;
  movesEl.textContent = movesLeft;
}

function findMatches() {
  const matched = new Set();

  // 橫向
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const type = board[r][c];
      if (type === null) {
        c++;
        continue;
      }
      let run = 1;
      while (c + run < COLS && board[r][c + run] === type) run++;
      if (run >= 3) {
        for (let k = 0; k < run; k++) matched.add(`${r},${c + k}`);
      }
      c += run;
    }
  }

  // 直向
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const type = board[r][c];
      if (type === null) {
        r++;
        continue;
      }
      let run = 1;
      while (r + run < ROWS && board[r + run][c] === type) run++;
      if (run >= 3) {
        for (let k = 0; k < run; k++) matched.add(`${r + k},${c}`);
      }
      r += run;
    }
  }

  return [...matched].map((s) => {
    const [r, c] = s.split(",").map(Number);
    return { r, c };
  });
}

function swap(a, b) {
  const t = board[a.r][a.c];
  board[a.r][a.c] = board[b.r][b.c];
  board[b.r][b.c] = t;
}

function adjacent(a, b) {
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

function applyGravity() {
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][c] !== null) {
        board[write][c] = board[r][c];
        if (write !== r) board[r][c] = null;
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      board[r][c] = null;
    }
  }
}

function refill() {
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c] === null) board[r][c] = randomType();
    }
  }
}

function hasValidMove() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c + 1 < COLS) {
        swap({ r, c }, { r, c: c + 1 });
        const okRight = findMatches().length > 0;
        swap({ r, c }, { r, c: c + 1 });
        if (okRight) return true;
      }
      if (r + 1 < ROWS) {
        swap({ r, c }, { r: r + 1, c });
        const okDown = findMatches().length > 0;
        swap({ r, c }, { r: r + 1, c });
        if (okDown) return true;
      }
    }
  }
  return false;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function reshuffle() {
  messageEl.textContent = "冇嘢可以消喇，洗牌中⋯";
  const flat = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) flat.push(board[r][c]);
  }

  let attempts = 0;
  do {
    shuffle(flat);
    let k = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) board[r][c] = flat[k++];
    }
    attempts++;
  } while ((findMatches().length > 0 || !hasValidMove()) && attempts < 200);

  render();
  messageEl.textContent = "";
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function resolveBoard() {
  resolving = true;
  while (true) {
    const matches = findMatches();
    if (matches.length === 0) break;

    score += matches.length * 10;
    render(matches);        // 爆開動畫
    await delay(260);

    for (const { r, c } of matches) board[r][c] = null;
    render();
    await delay(180);

    applyGravity();
    render();
    await delay(180);

    refill();
    render();
    await delay(180);
  }

  resolving = false;
  if (movesLeft <= 0) {
    messageEl.textContent = `🎉 遊戲結束！你攞到 ${score} 分`;
  } else if (!hasValidMove()) {
    reshuffle();
  }
}

function onCellClick(r, c) {
  if (resolving || movesLeft <= 0) return;
  if (board[r][c] === null) return;

  if (selected === null) {
    selected = { r, c };
    messageEl.textContent = "";
    render();
    return;
  }

  if (selected.r === r && selected.c === c) {
    selected = null;
    render();
    return;
  }

  if (!adjacent(selected, { r, c })) {
    selected = { r, c };
    messageEl.textContent = "";
    render();
    return;
  }

  const a = selected;
  selected = null;
  swap(a, { r, c });

  if (findMatches().length === 0) {
    swap(a, { r, c }); // 消唔到，換返原位
    render();
    messageEl.textContent = "咁樣消唔到，試第二度啦";
    return;
  }

  movesLeft--;
  messageEl.textContent = "";
  resolveBoard();
}

function startGame() {
  score = 0;
  movesLeft = MOVES_LIMIT;
  selected = null;
  resolving = false;
  messageEl.textContent = "";
  createBoard();
  render();
}

restartBtn.addEventListener("click", startGame);

startGame();
