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

## 🐇 Usage

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
    // ~ pass all options in first argument as {}
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

## 🔑 License

**The MIT License (MIT)**

Copyright © 2023 Funny Bunny