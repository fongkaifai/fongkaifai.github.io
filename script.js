const greeting = document.getElementById("greeting");
const btn = document.getElementById("btn");

const messages = [
  "Hello World 👋",
  "你好，世界！",
  "こんにちは世界！",
  "Bonjour le monde !",
  "Hola Mundo 🌎",
];

let index = 0;

btn.addEventListener("click", () => {
  index = (index + 1) % messages.length;
  greeting.textContent = messages[index];
});
