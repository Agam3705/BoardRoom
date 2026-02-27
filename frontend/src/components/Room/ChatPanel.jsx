import { useState, useRef, useEffect } from 'react';
import { socket } from '../../lib/socket';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import { Send, MessageSquare, BarChart2, Plus, X } from 'lucide-react';

const ChatPanel = ({ roomId, isOpen, toggleChat }) => {
    const { messages, addMessage, updateMessage } = useChatStore();
    const [input, setInput] = useState('');
    const { userInfo } = useAuthStore();
    const messagesEndRef = useRef(null);

    // Poll State
    const [isCreatingPoll, setIsCreatingPoll] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    useEffect(() => {
        const handlePollVote = ({ messageId, optionIndex, voter }) => {
            updateMessage(messageId, (msg) => {
                if (msg.type !== 'poll') return msg;
                const newOptions = [...msg.options];
                // Remove this voter from any previous options
                newOptions.forEach(opt => {
                    opt.votes = opt.votes.filter(v => v !== voter);
                });
                // Add vote to the selected option
                newOptions[optionIndex].votes.push(voter);
                return { ...msg, options: newOptions };
            });
        };
        socket.on('poll_vote', handlePollVote);
        return () => socket.off('poll_vote', handlePollVote);
    }, [updateMessage]);

    const sendMessage = (e) => {
        e.preventDefault();

        let msg;
        if (isCreatingPoll) {
            if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
            msg = {
                id: Date.now().toString(),
                type: 'poll',
                sender: userInfo.name,
                question: pollQuestion,
                options: pollOptions.filter(o => o.trim()).map(text => ({ text, votes: [] })),
                timestamp: new Date().toISOString(),
            };
            setIsCreatingPoll(false);
            setPollQuestion('');
            setPollOptions(['', '']);
        } else {
            if (!input.trim()) return;
            msg = {
                id: Date.now().toString(),
                type: 'text',
                text: input,
                sender: userInfo.name,
                timestamp: new Date().toISOString(),
            };
            setInput('');
        }

        socket.emit('chat_message', { roomId, message: msg });
        addMessage(msg); // Optimistically add
    };

    const handleVote = (messageId, optionIndex) => {
        updateMessage(messageId, (msg) => {
            if (msg.type !== 'poll') return msg;
            const newOptions = [...msg.options];
            newOptions.forEach(opt => {
                opt.votes = opt.votes.filter(v => v !== userInfo.name);
            });
            newOptions[optionIndex].votes.push(userInfo.name);
            return { ...msg, options: newOptions };
        });
        socket.emit('poll_vote', { roomId, messageId, optionIndex, voter: userInfo.name });
    };

    return (
        <div
            className={`h-full w-full bg-white dark:bg-dark-surface flex flex-col transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-dark-surface/50">
                <div className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <MessageSquare size={20} className="text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold">Room Chat</h3>
                </div>
                <button onClick={toggleChat} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    ×
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-dark-bg flex flex-col gap-3">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 text-sm">
                        No messages yet. Say hi!
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender === userInfo.name;

                        if (msg.type === 'poll') {
                            const totalVotes = msg.options.reduce((sum, opt) => sum + opt.votes.length, 0);
                            return (
                                <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">{msg.sender}</span>
                                    <div className={`p-3 rounded-2xl w-[90%] text-sm bg-white dark:bg-dark-surface border border-primary-100 dark:border-primary-900 shadow-sm ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                                        <div className="flex items-center gap-2 mb-2 font-semibold text-gray-800 dark:text-white">
                                            <BarChart2 size={16} className="text-primary-600 dark:text-primary-400" />
                                            {msg.question}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            {msg.options.map((opt, i) => {
                                                const hasVoted = opt.votes.includes(userInfo.name);
                                                const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleVote(msg.id, i)}
                                                        className={`relative overflow-hidden rounded-lg border p-2 cursor-pointer transition-colors ${hasVoted ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/40 dark:border-primary-500' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'}`}
                                                    >
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 bg-primary-100/50 dark:bg-primary-900/30 transition-all duration-500"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                        <div className="relative flex justify-between items-center text-xs">
                                                            <span className={hasVoted ? 'font-medium text-primary-900 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}>{opt.text}</span>
                                                            <span className="text-gray-500 dark:text-gray-400">{opt.votes.length} ({percentage}%)</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-2 text-right">{totalVotes} votes</div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1">{msg.sender}</span>
                                <div
                                    className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm break-words ${isMe
                                        ? 'bg-primary-600 text-white rounded-tr-sm'
                                        : 'bg-white dark:bg-dark-surface border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-white rounded-tl-sm shadow-sm'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2 relative transition-colors duration-200">
                {isCreatingPoll && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700 animate-fade-in-up w-full">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-gray-700 dark:text-white">Create Poll</h4>
                            <button onClick={() => setIsCreatingPoll(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><X size={14} /></button>
                        </div>
                        <input
                            type="text"
                            placeholder="Ask a question..."
                            value={pollQuestion}
                            onChange={e => setPollQuestion(e.target.value)}
                            className="w-full text-sm p-2 bg-white dark:bg-dark-bg text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg mb-2 outline-none focus:border-primary-500"
                        />
                        {pollOptions.map((opt, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={e => {
                                        const newOpts = [...pollOptions];
                                        newOpts[i] = e.target.value;
                                        setPollOptions(newOpts);
                                    }}
                                    className="flex-1 text-sm p-1.5 bg-white dark:bg-dark-bg text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-primary-500"
                                />
                                {pollOptions.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                                        className="text-red-400 hover:text-red-600 p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setPollOptions([...pollOptions, ''])}
                            className="text-xs flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700 mt-1"
                        >
                            <Plus size={12} /> Add Option
                        </button>
                    </div>
                )}

                <form onSubmit={sendMessage} className="flex relative items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsCreatingPoll(!isCreatingPoll)}
                        className={`p-2 shrink-0 rounded-full transition-colors ${isCreatingPoll ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title="Create Poll"
                    >
                        <BarChart2 size={18} />
                    </button>
                    {!isCreatingPoll ? (
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-gray-100 dark:bg-dark-bg text-gray-900 dark:text-white text-sm rounded-full pl-4 pr-12 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all border border-transparent focus:bg-white dark:focus:bg-dark-surface dark:border-gray-700"
                        />
                    ) : (
                        <div className="flex-1 text-xs text-gray-500 italic px-2">Fill out poll details above...</div>
                    )}
                    <button
                        type="submit"
                        disabled={(!isCreatingPoll && !input.trim()) || (isCreatingPoll && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2))}
                        className={`p-2 shrink-0 rounded-full transition-colors absolute right-1 ${(!isCreatingPoll && !input.trim()) || (isCreatingPoll && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) ? 'bg-gray-200 text-gray-400 pointer-events-none' : 'bg-primary-600 text-white hover:bg-primary-500'}`}
                    >
                        <Send size={16} className={(!isCreatingPoll && !input.trim()) || (isCreatingPoll && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) ? 'ml-0.5' : 'ml-0.5'} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;
