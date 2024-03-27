import MessageBoard from '../models/messageBoard.model.js';

export const getMessageBoard = async (req, res) => {
    try {
        const messageBoard = await MessageBoard.find({});
        res.status(200).json(messageBoard)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const createMessageBoard = async (req, res) => {
    try {
        const messageBoard = await MessageBoard.create(req.body)
        res.status(200).json(messageBoard)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateMessageBoard = async (req, res) => {
    try {
        const { id } = req.params;
        const messageBoard = await MessageBoard.findByIdAndUpdate(id, req.body);

        if(!messageBoard) {
            res.status(404).json({ message: 'MessageBoard not found' })
        }
        
        const updatedMessageBoard = await messageBoard.findById(id);
        res.status(200).json(updatedMessageBoard)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
