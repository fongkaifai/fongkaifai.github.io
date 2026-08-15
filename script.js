const greeting = document.getElementById("greeting");
const btn = document.getElementById("btn");
const count = document.getElementById("count");

const messages = [
  "Hello World 👋",
  "你好，世界！",
  "こんにちは世界！",
  "Bonjour le monde !",
  "Hola Mundo 🌎",
];

let index = 0;
let clicks = 0;

btn.addEventListener("click", () => {
  index = (index + 1) % messages.length;
  greeting.textContent = messages[index];

  clicks++;
  count.textContent = `你已經撳咗 ${clicks} 次`;
});
