import { getDBActiveSongList } from "../models/songList.model.js";

// SSE clients management
const sseClients = [];

export async function broadcastSongList() {
  try {
    const songs = await getDBActiveSongList();
    const data = `data: ${JSON.stringify(songs)}\n\n`;
    sseClients.forEach((client) => client.write(data));
  } catch (error) {
    console.error("[SSE] broadcast error:", error.message);
  }
}

export const streamSongList = async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send initial data immediately
  try {
    const songs = await getDBActiveSongList();
    res.write(`data: ${JSON.stringify(songs)}\n\n`);
  } catch (error) {
    res.write(`data: []\n\n`);
  }

  sseClients.push(res);

  req.on("close", () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
};
