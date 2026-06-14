const fs = require("fs");
const path = require("path");
const { BUNDLES_FILE, USERS_FILE } = require("./config");

let DB = [];
let USERS = [];

// ========== USERS LOAD ==========
function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    USERS = fs.readFileSync(USERS_FILE, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map(l => {
        const [id, refBy, points] = l.split("|||");
        return {
          id,
          refBy: refBy || "",
          points: Number(points || 0)
        };
      });
  }
}

function saveUsers() {
  fs.writeFileSync(
    USERS_FILE,
    USERS.map(u => `${u.id}|||${u.refBy}|||${u.points}`).join("\n")
  );
}

// ========== DB LOAD ==========
function loadDB() {
  DB = [];

  if (!fs.existsSync(BUNDLES_FILE)) return;

  const lines = fs.readFileSync(BUNDLES_FILE, "utf-8")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split("|");

    const title = parts[0];
    const link = parts[1];
    const stickers = parts[2] ? parts[2].split(",") : [];

    if (title && link) {
      DB.push({ id: i, title, link, stickers });
    }
  }

  console.log("🔄 DB LOADED:", DB.length);
}

module.exports = {
  DB,
  USERS,
  loadDB,
  loadUsers,
  saveUsers
};