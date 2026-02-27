import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket';
import useAuthStore from '../store/authStore';
import useCanvasStore from '../store/canvasStore';
import useChatStore from '../store/chatStore';
import { useTheme } from '../context/ThemeContext'; // Added import
import api from '../lib/axios';

import Canvas from '../components/Whiteboard/Canvas';
import Toolbar from '../components/Whiteboard/Toolbar';
import ChatPanel from '../components/Room/ChatPanel';
import ParticipantList from '../components/Room/ParticipantList';
import ReactionOverlay from '../components/Room/ReactionOverlay';
import PersonalNotes from '../components/Room/PersonalNotes';
import VideoChat from '../components/Room/VideoChat';
import { MessageSquare, Save, LogOut, Link as LinkIcon, AlertCircle, Smile, Edit3, Video, Maximize2, Minimize2, Shield, Loader2, Clock, Check, X, Sun, Moon } from 'lucide-react'; // Added Sun, Moon
import toast from 'react-hot-toast';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();
    const { clearCanvas, undo, redo, elements, setElements, setHistoryStep } = useCanvasStore();
    const { addMessage, clearMessages } = useChatStore();

    const [participants, setParticipants] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isReactionsOpen, setIsReactionsOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(true);
    const [isVideoExpanded, setIsVideoExpanded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [error, setError] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [waitingForApproval, setWaitingForApproval] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);

    const { theme, toggleTheme } = useTheme();

    // Load initial room data
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const { data } = await api.get(`/rooms/${roomId}`);
                setRoomInfo(data);
                if (data.whiteboardData && data.whiteboardData.length > 0) {
                    setElements(data.whiteboardData, false);
                }
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Error joining room');
                setLoading(false);
            }
        };
        fetchRoom();

        return () => {
            clearCanvas();
            clearMessages();
        };
    }, [roomId, setElements, clearCanvas, clearMessages]);

    // Socket Connection logic
    useEffect(() => {
        if (!loading && !error) {
            socket.connect();
            socket.emit('join_room', { roomId, user: { _id: userInfo._id, name: userInfo.name } });

            // Add self to participants initially (will be overwritten by users_updated but good for instant feedback)
            setParticipants([{ _id: userInfo._id, name: userInfo.name }]);

            const handleUsersUpdated = (users) => setParticipants(users);
            const handleChatMessage = (msg) => addMessage(msg);

            socket.on('users_updated', handleUsersUpdated);
            socket.on('chat_message', handleChatMessage);

            socket.on('join_pending', () => setWaitingForApproval(true));
            socket.on('join_approved', () => setWaitingForApproval(false));
            socket.on('join_denied', () => {
                setWaitingForApproval(false);
                setError('The host denied your request to join.');
            });
            socket.on('room_error', (msg) => setError(msg));

            socket.on('request_join', ({ socketId, user }) => {
                setJoinRequests(prev => [...prev, { socketId, user }]);
            });

            return () => {
                socket.off('users_updated', handleUsersUpdated);
                socket.off('chat_message', handleChatMessage);
                socket.off('join_pending');
                socket.off('join_approved');
                socket.off('join_denied');
                socket.off('request_join');
                socket.off('room_error');
                socket.emit('leave_room', { roomId });
                socket.disconnect();
            };
        }
    }, [roomId, userInfo, loading, error, addMessage]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            await api.put(`/rooms/${roomId}/save`, { whiteboardData: elements });
            setTimeout(() => setSaving(false), 1000); // Visual feedback
        } catch (err) {
            console.error('Failed to save', err);
            setSaving(false);
        }
    }, [roomId, elements]);

    // Auto-save debounced
    useEffect(() => {
        if (!loading && elements.length > 0) {
            const timeout = setTimeout(() => {
                handleSave();
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [elements, loading, handleSave]);

    const handleClear = () => {
        clearCanvas();
        socket.emit('clear_board', roomId);
        socket.emit('sync_board', { roomId, elements: [] });
    };

    const handleUndo = () => {
        const newElements = undo();
        if (newElements) {
            socket.emit('sync_board', { roomId, elements: newElements });
        }
    };

    const handleRedo = () => {
        const newElements = redo();
        if (newElements) {
            socket.emit('sync_board', { roomId, elements: newElements });
        }
    };

    const handleTimeTravel = (step) => {
        const newElements = setHistoryStep(step);
        if (newElements) {
            socket.emit('sync_board', { roomId, elements: newElements });
        }
    };

    const copyRoomLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        toast.success('Room code copied to clipboard!');
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleSendReaction = (emoji) => {
        // Emit reaction to room
        const payload = {
            roomId,
            emoji,
            userName: userInfo.name
        };
        socket.emit('reaction', payload);

        // Also fire locally for immediate feedback
        const event = new CustomEvent('local_reaction', { detail: payload });
        window.dispatchEvent(event);

        setIsReactionsOpen(false);
    };

    const handleDownload = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `boardroom-${roomId}.png`;
            a.click();
        }
    };

    const handleJoinResponse = (socketId, approved, user) => {
        if (approved) {
            socket.emit('approve_join', { socketId, roomId, user });
        } else {
            socket.emit('deny_join', { socketId });
        }
        setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
    };

    const calculateExpirationTimeLeft = () => {
        if (!roomInfo || roomInfo.roomType !== 'Temporary' || !roomInfo.expiresAt) return null;

        const now = new Date();
        const expires = new Date(roomInfo.expiresAt);
        const diffHours = (expires - now) / (1000 * 60 * 60);

        if (diffHours <= 0) return 'Expired';
        if (diffHours < 1) return '< 1 hr left';
        return `${Math.round(diffHours)} hrs left`;
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center text-primary-600 font-medium">Loading Workspace...</div>;
    }

    if (waitingForApproval) {
        return (
            <div className="h-screen flex items-center justify-center flex-col bg-gray-50 animate-fade-in">
                <Shield size={48} className="text-primary-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Host Approval Required</h2>
                <p className="text-gray-600 mb-6 font-medium">This is a private room. Please wait, the host will let you in soon...</p>
                <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center flex-col bg-gray-50">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-dark-bg flex flex-col font-sans transition-colors duration-200">
            {/* Proper Top Navigation Bar */}
            <header className="h-16 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 z-50 shrink-0 shadow-sm relative transition-colors duration-200">
                <div className="flex flex-row items-center gap-4">
                    <span className="font-bold text-gray-900 dark:text-white text-xl tracking-tight line-clamp-1 max-w-[200px]" title={roomInfo?.roomName || 'BoardRoom'}>
                        {roomInfo?.roomName || 'BoardRoom'}
                    </span>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 shadow-inner">
                        {roomInfo?.privacyState === 'Private' ? <Shield size={14} className="text-primary-600 dark:text-primary-400" /> : <LinkIcon size={14} className="text-gray-400" />}
                        <span className="text-gray-400">Room:</span>
                        <span className="font-mono select-all dark:text-white">{roomId}</span>
                    </div>

                    {/* Expiration Text for Temporary Rooms */}
                    {roomInfo?.roomType === 'Temporary' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-semibold border border-amber-200 shadow-sm animate-pulse-slow">
                            <Clock size={12} />
                            {calculateExpirationTimeLeft()}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex justify-center">
                    <ParticipantList participants={participants} />
                </div>

                <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2.5 rounded-lg shadow-sm border transition-colors bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-dark-surface dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-white`}
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {/* Copy Link */}
                    <button
                        onClick={copyRoomLink}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors border ${copySuccess ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-dark-surface dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
                    >
                        <LinkIcon size={16} />
                        {copySuccess ? 'Copied!' : 'Share'}
                    </button>

                    {/* Save Board */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium shadow-sm border border-primary-700 hover:bg-primary-700 transition-colors disabled:opacity-75"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save'}
                    </button>

                    {/* Toggle Notes */}
                    <button
                        onClick={() => setIsNotesOpen(!isNotesOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors border ${isNotesOpen ? 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-dark-surface dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
                    >
                        <Edit3 size={16} />
                        Notes
                    </button>

                    {/* Toggle Reactions */}
                    <div className="relative">
                        <button
                            onClick={() => setIsReactionsOpen(!isReactionsOpen)}
                            className={`p-2.5 rounded-lg shadow-sm border transition-colors ${isReactionsOpen ? 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-dark-surface dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
                            title="Reactions"
                        >
                            <Smile size={18} />
                        </button>
                        {isReactionsOpen && (
                            <div className="absolute top-14 right-0 bg-white dark:bg-dark-surface shadow-xl rounded-2xl border border-gray-100 dark:border-gray-800 p-2 flex gap-2 animate-fade-in-up">
                                {['❤️', '🔥', '👍', '✨', '😂'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleSendReaction(emoji)}
                                        className="text-2xl hover:scale-125 transition-transform p-2 hover:bg-gray-50 rounded-xl"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Toggle Chat */}
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`p-2.5 rounded-lg shadow-sm border transition-colors ${isChatOpen ? 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-dark-surface dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
                        title="Chat"
                    >
                        <MessageSquare size={18} />
                    </button>

                    {/* Toggle Video/Audio */}
                    <button
                        onClick={() => setIsVideoOpen(!isVideoOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors border ${isVideoOpen ? 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-dark-surface dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
                        title="Join Call"
                    >
                        <Video size={16} />
                        Call
                    </button>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

                    {/* Exit Room */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2.5 bg-white text-red-500 rounded-lg shadow-sm border border-gray-200 hover:bg-red-50 dark:bg-dark-surface dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                        title="Exit Room"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Host Approval Notifications Container */}
            <div className="absolute top-20 right-6 z-50 flex flex-col gap-2">
                {joinRequests.map((req, i) => (
                    <div key={i} className="bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-3 min-w-[300px] animate-fade-in-up">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                {req.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{req.user.name}</h4>
                                <p className="text-xs text-gray-500">Requested to join the board</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleJoinResponse(req.socketId, false, req.user)}
                                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                <X size={14} /> Deny
                            </button>
                            <button
                                onClick={() => handleJoinResponse(req.socketId, true, req.user)}
                                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                <Check size={14} /> Admit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content App Workspace */}
            <div className="flex-1 flex flex-row overflow-hidden relative">

                {/* Left Sidebar Toolbar (Proper Side bar) */}
                <div className="h-full flex flex-col justify-center z-40 ml-4 pointer-events-none absolute left-0">
                    <aside className="w-[100px] max-h-[90vh] bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center py-2 shrink-0 shadow-xl relative pointer-events-auto overflow-y-auto custom-scrollbar">
                        <Toolbar
                            handleClear={handleClear}
                            handleUndo={handleUndo}
                            handleRedo={handleRedo}
                            handleDownload={handleDownload}
                            handleTimeTravel={handleTimeTravel}
                            roomId={roomId}
                        />
                    </aside>
                </div>

                {/* Canvas Bounding Area */}
                <main className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-dark-bg z-0">
                    <Canvas roomId={roomId} />
                    <ReactionOverlay roomId={roomId} />

                    {/* Video Chat Overlay */}
                    {isVideoOpen && (
                        <div
                            className={`absolute bottom-6 right-6 z-40 transition-all duration-300 ease-in-out shadow-2xl rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 ${isVideoExpanded ? 'w-[60vw] h-[60vh] md:w-[800px] md:h-[600px]' : 'w-72 h-48'
                                }`}
                        >
                            <div className="absolute top-2 right-2 z-50 flex gap-1">
                                <button
                                    onClick={() => setIsVideoExpanded(!isVideoExpanded)}
                                    className="p-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-200 rounded-lg backdrop-blur shadow-sm transition-colors"
                                >
                                    {isVideoExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                </button>
                            </div>
                            <VideoChat roomId={roomId} isExpanded={isVideoExpanded} />
                        </div>
                    )}
                </main>

                {/* Right Panel Layout (Chat / Notes) */}
                <aside
                    className={`bg-white dark:bg-dark-surface z-40 shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] border-l border-gray-200 dark:border-gray-800 flex flex-col relative h-full transition-all duration-300 ${isChatOpen || isNotesOpen ? 'w-80' : 'w-0 border-none opacity-0'}`}
                >
                    <div className={`w-80 h-full absolute right-0 top-0 flex flex-col bg-white dark:bg-dark-surface ${isChatOpen ? 'z-20' : 'z-0 invisible'}`}>
                        <ChatPanel roomId={roomId} isOpen={isChatOpen} toggleChat={() => setIsChatOpen(false)} />
                    </div>
                    <div className={`w-80 h-full absolute right-0 top-0 flex flex-col bg-white dark:bg-dark-surface ${isNotesOpen && !isChatOpen ? 'z-20' : 'z-0 invisible'}`}>
                        <PersonalNotes isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} roomId={roomId} />
                    </div>
                </aside>
            </div>
        </div >
    );
};

export default Room;
