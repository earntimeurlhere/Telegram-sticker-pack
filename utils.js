async function extractStickers(bot, packLink) {
  try {
    const match = packLink.match(/addstickers\/(.+)/);
    if (!match) return [];

    const packName = match[1];
    const result = await bot.telegram.getStickerSet(packName);

    return result.stickers.map(s => s.file_id);
  } catch (e) {
    return [];
  }
}

module.exports = { extractStickers };