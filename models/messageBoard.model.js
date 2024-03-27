import mongoose from "mongoose";

const messageBoardSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Please enter content"],
    },
  },
  { timestamps: true }
);

const MessageBoard = mongoose.model("MessageBoard", messageBoardSchema);

export default MessageBoard;