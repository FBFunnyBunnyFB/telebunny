<h1 align="center">TeleBunny</h1>

<div align="center">

Lightweight zero-dependency Node.js module for [Telegram Bot API](https://core.telegram.org/bots/api).


[![Bot API Version](https://img.shields.io/badge/Bot%20API-v6.7-00aced.svg?logo=telegram)](https://core.telegram.org/bots/api#recent-changes)
[![Node Version](https://img.shields.io/badge/Node-v6.17.1+-brightgreen.svg)](https://nodejs.org/)
[![NPM Package Version](https://img.shields.io/npm/v/telebunny.svg)](https://www.npmjs.com/package/telebunny)

[![https://t.me/FBFunnyBunnyFB](https://img.shields.io/badge/💬%20Telegram-Funny_Bunny-blue.svg?style=flat-square)](https://t.me/FBFunnyBunnyFB)

</div>

## 📥 Installation

```sh
npm i telebunny
```

## 🐇 Usage (Polling)

```typescript
import { TeleBunny } from "telebunny";

// Replace <TOKEN> with your bot token
const BOT_TOKEN = "<TOKEN>";
// Use "polling" option for fetching new updates using polling method
const TelegramBot = new TeleBunny(BOT_TOKEN, { polling: true });

// Use listeners to get data from Telegram users
// Update type parameter can be found on official Telegram Bot API
TelegramBot.on('message', msg => {
    // Send response message to chat
    TelegramBot.sendMessage(msg.chat.id, "Got message update");
});

// You can also use "got" method as the alias for "on" listeners
TelegramBot.got('edited_message', msg => {
    // TeleBunny class instance supports two different option masks
    // You can pass options to method in such a way:
    // ~ pass all options in first argument as object
    // OR
    // ~ pass options according to API required fields
    TelegramBot.sendMessage(msg.chat.id, "Got edited_message update", {
        allow_sending_without_reply: true,
        reply_to_message_id: msg.message_id
    });
    // Uncomment to test alternative method
    /*
    TelegramBot.sendMessage({
        chat_id: msg.chat.id,
        text: "Got edited_message update (raw options)",
        allow_sending_without_reply: true,
        reply_to_message_id: msg.message_id
    });
    */
})
```

## 🐇 Usage (Webhook)

```typescript
// Production server code example
// You can use any library/framework for handling HTTP/HTTPS requests
import { TeleBunny } from "telebunny";
import { createServer } from "http";

// Replace <TOKEN> with your bot token
const BOT_TOKEN = "<TOKEN>";
// Replace <WEBHOOK> with your url
const WEBHOOK_URL = "<WEBHOOK>"+BOT_TOKEN;
// You don't need to set "polling" option when using webhook
const TelegramBot = new TeleBunny(BOT_TOKEN);

// Set webhook
TelegramBot.setWebhook(WEBHOOK_URL);

// Add listener for inline requests
TelegramBot.on("inline_query", msg => {
    const query = msg.query || "npm telebunny";
    TelegramBot.answerInlineQuery({
        inline_query_id: msg.id,
        button: {
            text: "Search \""+query+"\" in Google",
            web_app: {
                url: "https://www.google.com/search?q="+encodeURIComponent(query)
            }
        }
    });
});

// Create HTTP server
createServer((req, res) => {
    // Process only POST requests for webhook route
    if(req.method !== "POST" || req.url !== "/"+BOT_TOKEN) return;
    const chunks:any = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
        const data = Buffer.concat(chunks);
        // To process incoming messages use processUpdate() method
        // "data" variable must be Buffer or object type
        TelegramBot.processUpdate(data);
    });
    res.writeHead(200);
    res.end();
}).listen(process.env.PORT || 3000);
```

## 🔑 License

**The MIT License (MIT)**

Copyright © 2023 Funny Bunny