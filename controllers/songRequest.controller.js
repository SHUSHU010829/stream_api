import {
  getDBPendingRequests,
  getDBRequestsByRequester,
  getDBAllRequests,
  getDBRequestById,
  getDBPendingRequestByRepertoireId,
  createDBRequest,
  updateDBRequestChatNotified,
  approveDBRequest,
  rejectDBRequest,
  deleteDBRequest,
} from "../models/songRequest.model.js";
import { getDBRepertoireById } from "../models/repertoire.model.js";
import {
  getDBActiveSongByTitle,
  getDBNextActiveSortOrder,
  createDBSongFromRequest,
} from "../models/songList.model.js";
import { broadcastSongList } from "../services/songListStream.service.js";
import { sendChatMessage } from "../services/twitchChat.service.js";

const isUniqueViolation = (error) => error?.code === "23505";

// fire-and-forget：絕不能讓聊天室發送失敗擋住點歌流程
function notifyChatAsync(requestId, message) {
  sendChatMessage(message)
    .then((result) => updateDBRequestChatNotified(requestId, result))
    .catch((error) => {
      console.error("[songRequest] chat notify failed:", error.message);
    });
}

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await getDBPendingRequests();
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyRequests = async (req, res) => {
  const { twitch_id } = req.query;
  if (!twitch_id) {
    return res.status(400).json({ message: "請提供 twitch_id！" });
  }
  try {
    const requests = await getDBRequestsByRequester(twitch_id);
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllRequests = async (req, res) => {
  const { status } = req.query;
  try {
    const requests = await getDBAllRequests({ status });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRequest = async (req, res) => {
  const { repertoire_id, song_title, singer, requester, source } = req.body;
  if (
    !song_title ||
    !requester ||
    !requester.twitch_id ||
    !requester.login ||
    !requester.display_name
  ) {
    return res.status(400).json({ message: "請提供歌曲與點歌者資訊！" });
  }

  try {
    let finalTitle = song_title;
    let finalSinger = singer ?? "";

    if (repertoire_id) {
      const repertoire = await getDBRepertoireById(repertoire_id);
      if (!repertoire) {
        return res.status(404).json({ message: "找不到曲庫歌曲！" });
      }
      finalTitle = repertoire.song_title;
      finalSinger = repertoire.singer;

      const pendingForRepertoire = await getDBPendingRequestByRepertoireId(
        repertoire_id
      );
      if (pendingForRepertoire) {
        return res.status(409).json({ message: "這首歌已經有人點過了！" });
      }
    }

    const activeInQueue = await getDBActiveSongByTitle(finalTitle);
    if (activeInQueue) {
      return res.status(409).json({ message: "這首歌已經在歌單裡了！" });
    }

    let newRequest;
    try {
      newRequest = await createDBRequest({
        repertoire_id,
        song_title: finalTitle,
        singer: finalSinger,
        requester_twitch_id: requester.twitch_id,
        requester_login: requester.login,
        requester_display_name: requester.display_name,
        source,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return res.status(409).json({ message: "這首歌已經有人點過了！" });
      }
      throw error;
    }

    res.status(201).json(newRequest);

    notifyChatAsync(
      newRequest.id,
      `@${requester.display_name} 點的《${finalTitle}》已送出，等待主播審核！`
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await getDBRequestById(id);
    if (!request) {
      return res.status(404).json({ message: "找不到點歌紀錄！" });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ message: "此點歌已處理過！" });
    }

    const activeInQueue = await getDBActiveSongByTitle(request.song_title);
    if (activeInQueue) {
      return res.status(409).json({ message: "這首歌已經在歌單裡了！" });
    }

    const nextSortOrder = await getDBNextActiveSortOrder();

    const newSong = await createDBSongFromRequest({
      song_title: request.song_title,
      singer: request.singer,
      requester_login: request.requester_login,
      requester_display_name: request.requester_display_name,
      request_id: request.id,
      sort_order: nextSortOrder,
    });

    await approveDBRequest(id, { song_list_id: newSong.id });

    res.status(200).json({ message: "已接受點歌！" });
    broadcastSongList();

    notifyChatAsync(
      request.id,
      `@${request.requester_display_name} 你點的《${request.song_title}》已加入歌單！`
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const request = await getDBRequestById(id);
    if (!request) {
      return res.status(404).json({ message: "找不到點歌紀錄！" });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ message: "此點歌已處理過！" });
    }

    await rejectDBRequest(id, { reason });
    res.status(200).json({ message: "已拒絕點歌！" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const count = await deleteDBRequest(id);
    if (count === 0) {
      return res.status(404).json({ message: "找不到點歌紀錄！" });
    }
    res.status(200).json({ message: "點歌紀錄已刪除！" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
