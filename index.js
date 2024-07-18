const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const axios = require("axios");
const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.json");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = config.webhookSecret;

app.use(bodyParser.json());

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(config.activity);
});

client.on("messageCreate", (message) => {
  if (message.content === "!ping") {
    message.reply("Pong!");
  }
});

client.login(config.token);

function verifySignature(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];
  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac("sha256", SECRET);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  if (signature === digest) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
}

app.post("/webhook", verifySignature, async (req, res) => {
  const payload = req.body;
  console.log("Webhook received:", payload);

  // 커밋 정보를 처리하고 디스코드 채널에 전송
  const commits = payload.commits;
  const repoName = payload.repository.name;
  const branchName = payload.ref.split("/").pop();

  let message = `New commits to ${repoName} on branch ${branchName}:\n`;

  commits.forEach((commit) => {
    message += `\n- ${commit.message} by ${commit.author.name}`;
  });

  try {
    const channel = client.channels.cache.get(config.channelId);
    if (channel) {
      await channel.send(message);
    }
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error sending message to Discord:", error);
    res.status(500).send("Error sending message to Discord");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
