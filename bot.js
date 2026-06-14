const { Telegraf } = require("telegraf");
const fs = require("fs");
const {
  BOT_TOKEN,
  BOT_USERNAME
} = require("./config");

const {
  DB,
  USERS,
  loadDB,
  loadUsers,
  saveUsers
} = require("./db");

const { extractStickers } = require("./utils");

// LOAD INIT DATA
loadUsers();
loadDB();
setInterval(loadDB, 5000);

const bot = new Telegraf(BOT_TOKEN);

// ================= START =================
bot.start((ctx) => {
  const userId = String(ctx.from.id);
  const ref = ctx.startPayload;

  let user = USERS.find(u => u.id === userId);

  if (!user) {
    user = {
      id: userId,
      refBy: ref || "",
      points: 1
    };

    USERS.push(user);

    if (ref && ref !== userId) {
      let refUser = USERS.find(u => u.id === ref);
      if (refUser) {
        refUser.points += 1;
        bot.telegram.sendMessage(refUser.id, "🎉 +1 Referral Point Added!");
      }
    }

    saveUsers();
  }

  ctx.reply(
`👋 Welcome to Sticker Hub Bot

👤 Name: ${ctx.from.first_name}
🆔 ID: ${userId}

💎 Points: ${user.points}

🚀 Invite friends & earn rewards`,
{
  reply_markup: {
    inline_keyboard: [[
      {
        text: "🎁 Invite",
        url: `https://t.me/share/url?url=https://t.me/${BOT_USERNAME}?start=${userId}`
      }
    ]]
  }
});
});

// ================= SEARCH =================
bot.on("text", async (ctx) => {
  const q = ctx.message.text.toLowerCase().trim();

  const found = DB.filter(b =>
    b.title.toLowerCase().includes(q)
  );

  if (!found.length) return ctx.reply("❌ No sticker pack found");

  for (let b of found) {
    await ctx.reply(`📦 ${b.title}`);

    const preview = (b.stickers || []).slice(0, 2);

    for (let s of preview) {
      try {
        await ctx.replyWithSticker(s);
      } catch {}
    }

    await ctx.reply("👇 Open Pack (1 Point Required)", {
      reply_markup: {
        inline_keyboard: [[
          {
            text: "📦 Open Pack",
            callback_data: `open_${b.id}`
          }
        ]]
      }
    });
  }
});

// ================= CALLBACK =================
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (!data.startsWith("open_")) return;

  const id = parseInt(data.split("_")[1]);
  const pack = DB.find(p => p.id === id);

  const userId = String(ctx.from.id);
  let user = USERS.find(u => u.id === userId);

  if (!pack) return ctx.answerCbQuery("❌ Not found");

  if (!user) {
    user = { id: userId, refBy: "", points: 0 };
    USERS.push(user);
  }

  if (user.points < 1) {
    return ctx.reply("❌ Not enough points");
  }

  user.points -= 1;
  saveUsers();

  ctx.answerCbQuery("Opening...");

  const preview = (pack.stickers || []).slice(0, 2);

  for (let s of preview) {
    try {
      await ctx.replyWithSticker(s);
    } catch {}
  }

  ctx.reply(`🎁 PACK UNLOCKED\n📦 ${pack.title}`);
});

bot.launch();
console.log("🚀 BOT RUNNING");