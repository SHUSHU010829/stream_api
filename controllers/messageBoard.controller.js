import { getDBAllMsg, createDBMsg } from "../models/messageBoard.model.js";

export const getAllMsg = async (req, res) => {
  try {
    const msgs = await getDBAllMsg();
    res.status(200).json(msgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMsg = async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === "") {
    throw createError(400, "訊息不得為空！");
  }
  try {
    const newMsg = await createDBMsg(content);
    res.status(201).json(newMsg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
