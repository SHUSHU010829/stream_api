import tmi from "tmi.js";

const MAX_MESSAGE_LENGTH = 480;

const username = process.env.TWITCH_BOT_USERNAME;
const password = process.env.TWITCH_PASSWORD;
const channel = process.env.TWITCH_CHANNEL;

let client = null;
let connectPromise = null;

function sanitizeMessage(message) {
  let sanitized = String(message).replace(/[\r\n]+/g, " ").trim();
  // 開頭的 / 或 . 會被 Twitch 當成聊天室指令
  sanitized = sanitized.replace(/^[./]+/, "");
  return sanitized.slice(0, MAX_MESSAGE_LENGTH);
}

// 跟 twitch_bot 專案（src/index.js）同一套發送方式：tmi.js 長連線 + client.say()。
// 惰性建立、只連線一次；連線本身的錯誤只記 log，絕不 throw 到呼叫端。
function getClient() {
  if (!username || !password || !channel) return null;
  if (!client) {
    client = new tmi.Client({
      identity: { username, password },
      channels: [channel],
    });
    client.on("disconnected", (reason) => {
      console.error("[TwitchChat] disconnected:", reason);
    });
    connectPromise = client.connect().catch((error) => {
      // tmi.js 的 reject 常是純字串（例如 "Login authentication failed"）而非 Error。
      console.error("[TwitchChat] connect failed:", error?.message ?? error);
      client = null;
      connectPromise = null;
    });
  }
  return client;
}

// 聊天室發送絕對不能讓呼叫端失敗：一律吞掉錯誤，回傳 {sent, dropReason}。
export async function sendChatMessage(rawMessage) {
  if (process.env.TWITCH_CHAT_ENABLED === "false") {
    return { sent: false, dropReason: "chat_disabled" };
  }

  const message = sanitizeMessage(rawMessage);
  if (!message) {
    return { sent: false, dropReason: "empty_message" };
  }

  const activeClient = getClient();
  if (!activeClient) {
    return { sent: false, dropReason: "not_configured" };
  }

  try {
    if (connectPromise) await connectPromise;
    if (!client) {
      // 上次連線失敗，getClient() 已把 client 重置，這次直接放棄不重試。
      return { sent: false, dropReason: "not_connected" };
    }
    await activeClient.say(channel, message);
    return { sent: true, dropReason: null };
  } catch (error) {
    console.error("[TwitchChat] send error:", error?.message ?? error);
    return { sent: false, dropReason: "exception" };
  }
}
