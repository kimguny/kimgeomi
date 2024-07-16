const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (message) => {
  if (message.content === "!ping") {
    message.reply("Pong!");
  }
});

client.login(config.token);
