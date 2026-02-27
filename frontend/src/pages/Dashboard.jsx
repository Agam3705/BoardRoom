import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../lib/axios';
import { LogOut, Plus, Users, Layout, FileText, ArrowRight, Loader2, X, Clock, Shield, Lock, Globe, Star, Trash2, Edit3, Sun, Moon, Folder, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const CreateRoomModal = ({ isOpen, onClose, onCreate }) => {
    const [privacyState, setPrivacyState] = useState('Public');
    const [roomType, setRoomType] = useState('Permanent');
    const [durationHours, setDurationHours] = useState('24');
    const [roomName, setRoomName] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onCreate({ roomName, privacyState, roomType, durationHours: roomType === 'Temporary' ? durationHours : null });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Create New Board</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {/* Room Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Name (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Weekly Standup, Project Brainstorm..."
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            maxLength={50}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Privacy */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Shield size={16} className="text-primary-500" />
                            Privacy Setting
                        </label>
                        <select
                            value={privacyState}
                            onChange={(e) => setPrivacyState(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
                        >
                            <option value="Public">Public (Anyone with link can join)</option>
                            <option value="Private">Private (Host approval required)</option>
                            <option value="Hidden">Hidden (Unlisted)</option>
                        </select>
                    </div>

                    {/* Duration / Room Type */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Clock size={16} className="text-primary-500" />
                            Room Duration
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button
                                type="button"
                                onClick={() => setRoomType('Permanent')}
                                className={`py-2 px-3 text-sm font-medium rounded-lg border flex items-center justify-center transition-colors ${roomType === 'Permanent' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                Permanent
                            </button>
                            <button
                                type="button"
                                onClick={() => setRoomType('Temporary')}
                                className={`py-2 px-3 text-sm font-medium rounded-lg border flex items-center justify-center transition-colors ${roomType === 'Temporary' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                Temporary
                            </button>
                        </div>

                        {roomType === 'Temporary' && (
                            <div className="animate-fade-in-up">
                                <label className="block text-xs text-gray-500 mb-1">Expires after (Hours)</label>
                                <select
                                    value={durationHours}
                                    onChange={(e) => setDurationHours(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
                                >
                                    <option value="1">1 Hour</option>
                                    <option value="3">3 Hours</option>
                                    <option value="24">24 Hours</option>
                                    <option value="72">3 Days</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                    >
                        {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                        {loading ? 'Generating 6-Digit Code...' : 'Create Room'}
                    </button>
                </form>
            </div>
        </div>
    );
};



const EditNoteModal = ({ isOpen, onClose, note, onSave }) => {
    const [content, setContent] = useState('');
    useEffect(() => {
        if (note) setContent(note.content);
    }, [note]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Edit Personal Note</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder="Write your note..."
                    />
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={() => onSave(note.roomId, content)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { userInfo, logout } = useAuthStore();
    const navigate = useNavigate();
    const [joinRoomId, setJoinRoomId] = useState('');
    const [savedRooms, setSavedRooms] = useState([]);
    const [publicRooms, setPublicRooms] = useState([]);
    const [favoriteRooms, setFavoriteRooms] = useState([]);
    const [fetchingRooms, setFetchingRooms] = useState(true);
    const [savedNotes, setSavedNotes] = useState([]);
    const [fetchingNotes, setFetchingNotes] = useState(true);
    const [activeTab, setActiveTab] = useState('my-boards'); // 'my-boards', 'history', 'vault', 'public'
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editNoteModalData, setEditNoteModalData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchRoomsAndNotes = async () => {
            try {
                const [roomsRes, publicRes, notesRes] = await Promise.all([
                    api.get('/rooms'),
                    api.get('/rooms/public/all'),
                    api.get('/notes/vault/all')
                ]);
                setSavedRooms(roomsRes.data.rooms);
                setFavoriteRooms(roomsRes.data.favoriteRooms || []);
                setPublicRooms(publicRes.data);
                setSavedNotes(notesRes.data);
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            } finally {
                setFetchingRooms(false);
                setFetchingNotes(false);
            }
        };
        fetchRoomsAndNotes();
    }, []);

    const handleDeleteRoom = async (e, roomId, isHost) => {
        e.stopPropagation();
        const msg = isHost
            ? 'Are you sure you want to PERMANENTLY delete this room for everyone?'
            : 'Are you sure you want to remove this room from your history?';

        if (!window.confirm(msg)) return;

        try {
            await api.delete(`/rooms/${roomId}`);
            setSavedRooms(prev => prev.filter(r => r.roomId !== roomId));
            toast.success(isHost ? "Room deleted permanently" : "Room removed from history");
        } catch (err) {
            console.error('Error deleting room', err);
            toast.error(isHost ? "Failed to delete room" : "Failed to remove room");
        }
    };

    const handleToggleFavorite = async (e, roomId) => {
        e.stopPropagation();
        try {
            const { data } = await api.post(`/rooms/${roomId}/favorite`);
            setFavoriteRooms(data.favoriteRooms);
            toast.success(data.isFavorited ? "Room pinned to top" : "Room unpinned");
        } catch (err) {
            console.error('Error toggling favorite', err);
            toast.error("Failed to pin room");
        }
    };

    const handleDeleteNote = async (e, roomId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this note from your vault?')) return;
        try {
            await api.delete(`/notes/${roomId}`);
            setSavedNotes(prev => prev.filter(n => n.roomId !== roomId));
            toast.success('Note deleted');
        } catch (error) {
            toast.error('Failed to delete note');
        }
    };

    const handleSaveNote = async (roomId, content) => {
        try {
            await api.put(`/notes/${roomId}`, { content });
            setSavedNotes(prev => prev.map(n => n.roomId === roomId ? { ...n, content } : n));
            setEditNoteModalData(null);
            toast.success('Note updated');
        } catch (error) {
            toast.error('Failed to update note');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCreateRoomSubmit = async (params) => {
        try {
            setError('');
            const { data } = await api.post('/rooms', params);
            navigate(`/room/${data.roomId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create room');
        }
    };

    const joinRoom = (e) => {
        e.preventDefault();
        if (!joinRoomId.trim()) return;
        navigate(`/room/${joinRoomId.trim()}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
            <nav className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Layout className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">BoardRoom</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 dark:text-gray-300">Hi, {userInfo?.name}</span>
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div className="md:grid md:grid-cols-2 md:gap-8">
                    {/* Create Room Card */}
                    <div className="bg-white dark:bg-dark-surface overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-gray-800 mb-8 md:mb-0 transform transition duration-300 hover:shadow-md hover:-translate-y-1">
                        <div className="px-4 py-5 sm:p-6 text-center h-full flex flex-col justify-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30">
                                <Plus className="h-8 w-8 text-primary-600" />
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Create a New Board</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Start a fresh canvas and invite your team to collaborate in real-time.
                            </p>
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    New Board
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Join Room Card */}
                    <div className="bg-white dark:bg-dark-surface overflow-hidden shadow-sm rounded-xl border border-gray-200 dark:border-gray-800 transform transition duration-300 hover:shadow-md hover:-translate-y-1">
                        <div className="px-4 py-5 sm:p-6 text-center h-full flex flex-col justify-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Join an Existing Board</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Enter a room ID shared by your team to jump right into collaboration.
                            </p>
                            <div className="mt-6">
                                <form onSubmit={joinRoom} className="flex flex-col sm:flex-row justify-center gap-2">
                                    <input
                                        type="text"
                                        value={joinRoomId}
                                        onChange={(e) => setJoinRoomId(e.target.value)}
                                        placeholder="Enter Room ID"
                                        required
                                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-dark-bg dark:text-white rounded-md px-3 py-2 border outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                                    >
                                        Join Room
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Tabs & Search */}
                <div className="mt-12 w-full max-w-5xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                        <div className="flex items-center gap-6 font-sans overflow-x-auto whitespace-nowrap hide-scrollbar flex-1">

                            <button
                                onClick={() => setActiveTab('my-boards')}
                                className={`pb-4 text-[15px] font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'my-boards' ? 'border-primary-600 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <Folder className={activeTab === 'my-boards' ? 'text-primary-600 dark:text-primary-400' : ''} size={18} />
                                My Boards
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`pb-4 text-[15px] font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary-600 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <FileText className={activeTab === 'history' ? 'text-primary-600 dark:text-primary-400' : ''} size={18} />
                                Room History
                            </button>
                            <button
                                onClick={() => setActiveTab('public')}
                                className={`pb-4 text-[15px] font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'public' ? 'border-primary-600 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <Globe className={activeTab === 'public' ? 'text-primary-600 dark:text-primary-400' : ''} size={18} />
                                Public Directory
                            </button>
                            <button
                                onClick={() => setActiveTab('vault')}
                                className={`pb-4 text-[15px] font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'vault' ? 'border-primary-600 text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                <Lock className={activeTab === 'vault' ? 'text-primary-600 dark:text-primary-400' : ''} size={18} />
                                Personal Vault
                            </button>
                        </div>
                        <div className="relative pb-4 sm:max-w-xs w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mb-4">
                                <Search size={16} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search boards, IDs or hosts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {activeTab === 'my-boards' && (
                        <div className="animate-fade-in-up">
                            {fetchingRooms ? (
                                <div className="text-center text-gray-500 py-8">Loading your boards...</div>
                            ) : savedRooms.filter(r => (r.hostId?._id === userInfo?._id || r.hostId === userInfo?._id) && (!searchQuery || r.roomId.toLowerCase().includes(searchQuery.toLowerCase()) || (r.roomName && r.roomName.toLowerCase().includes(searchQuery.toLowerCase())))).length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...savedRooms]
                                        .filter(r => (r.hostId?._id === userInfo?._id || r.hostId === userInfo?._id) && (!searchQuery || r.roomId.toLowerCase().includes(searchQuery.toLowerCase()) || (r.roomName && r.roomName.toLowerCase().includes(searchQuery.toLowerCase()))))
                                        .sort((a, b) => favoriteRooms.includes(b._id) - favoriteRooms.includes(a._id))
                                        .map(room => {
                                            const isFavorite = favoriteRooms.includes(room._id);
                                            return (
                                                <div key={room._id} className={`bg-white dark:bg-dark-surface rounded-xl shadow-sm border p-5 hover:shadow-md transition cursor-pointer group flex flex-col justify-between ${isFavorite ? 'border-amber-300 ring-1 ring-amber-100 dark:border-amber-500/50 dark:ring-amber-900/30' : 'border-gray-200 dark:border-gray-800'}`} onClick={() => navigate(`/room/${room.roomId}`)}>
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${room.privacyState === 'Public' ? 'bg-green-100 text-green-800' : room.privacyState === 'Hidden' ? 'bg-purple-100 text-purple-800' : 'bg-primary-100 text-primary-800'}`}>
                                                                {room.privacyState}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => handleToggleFavorite(e, room.roomId)}
                                                                    className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${isFavorite ? 'text-amber-500' : 'text-gray-400'} opacity-0 group-hover:opacity-100 ${isFavorite ? 'opacity-100' : ''}`}
                                                                    title={isFavorite ? "Unpin Room" : "Pin Room"}
                                                                >
                                                                    <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
                                                                </button>
                                                                <span className="text-xs text-gray-500">{new Date(room.updatedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{room.roomName || `Board: ${room.roomId}`}</h4>
                                                        {room.roomName && <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-mono">ID: {room.roomId}</p>}
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{room.whiteboardData?.length || 0} Elements</p>
                                                    </div>
                                                    <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => handleDeleteRoom(e, room.roomId, true)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Delete Board Permanently">
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <span className="text-primary-600 flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-1">
                                                            Enter <ArrowRight size={16} />
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            ) : (
                                <div className="text-center bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                                    <p className="text-gray-500 dark:text-gray-400">You haven&apos;t created any boards yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fade-in-up">
                            {fetchingRooms ? (
                                <div className="text-center text-gray-500 py-8">Loading history...</div>
                            ) : savedRooms.filter(r => (r.hostId?._id !== userInfo?._id && r.hostId !== userInfo?._id) && (!searchQuery || r.roomId.toLowerCase().includes(searchQuery.toLowerCase()) || (r.roomName && r.roomName.toLowerCase().includes(searchQuery.toLowerCase())) || (r.hostId && r.hostId.name && r.hostId.name.toLowerCase().includes(searchQuery.toLowerCase())))).length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...savedRooms]
                                        .filter(r => (r.hostId?._id !== userInfo?._id && r.hostId !== userInfo?._id) && (!searchQuery || r.roomId.toLowerCase().includes(searchQuery.toLowerCase()) || (r.roomName && r.roomName.toLowerCase().includes(searchQuery.toLowerCase())) || (r.hostId && r.hostId.name && r.hostId.name.toLowerCase().includes(searchQuery.toLowerCase()))))
                                        .sort((a, b) => favoriteRooms.includes(b._id) - favoriteRooms.includes(a._id))
                                        .map(room => {
                                            const isFavorite = favoriteRooms.includes(room._id);
                                            return (
                                                <div key={room._id} className={`bg-white dark:bg-dark-surface rounded-xl shadow-sm border p-5 hover:shadow-md transition cursor-pointer group flex flex-col justify-between ${isFavorite ? 'border-amber-300 ring-1 ring-amber-100 dark:border-amber-500/50 dark:ring-amber-900/30' : 'border-gray-200 dark:border-gray-800'}`} onClick={() => navigate(`/room/${room.roomId}`)}>
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                                                {room.privacyState}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => handleToggleFavorite(e, room.roomId)}
                                                                    className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${isFavorite ? 'text-amber-500' : 'text-gray-400'} opacity-0 group-hover:opacity-100 ${isFavorite ? 'opacity-100' : ''}`}
                                                                    title={isFavorite ? "Unpin Room" : "Pin Room"}
                                                                >
                                                                    <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
                                                                </button>
                                                                <span className="text-xs text-gray-500">{new Date(room.updatedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{room.roomName || `Board: ${room.roomId}`}</h4>
                                                        {room.roomName && <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-mono">ID: {room.roomId}</p>}
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Host: {room.hostId?.name || 'Unknown'}</p>
                                                    </div>
                                                    <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => handleDeleteRoom(e, room.roomId, false)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors" title="Remove from History">
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <span className="text-primary-600 flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-1">
                                                            Enter <ArrowRight size={16} />
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            ) : (
                                <div className="text-center bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                                    <p className="text-gray-500 dark:text-gray-400">No external room history found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'public' && (
                        <div className="animate-fade-in-up">
                            {fetchingRooms ? (
                                <div className="text-center text-gray-500 py-8">Loading public directory...</div>
                            ) : publicRooms.filter(r => !searchQuery || r.roomId.toLowerCase().includes(searchQuery.toLowerCase()) || (r.roomName && r.roomName.toLowerCase().includes(searchQuery.toLowerCase())) || (r.hostId && r.hostId.name && r.hostId.name.toLowerCase().includes(searchQuery.toLowerCase()))).length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...publicRooms]
                                        .filter(r => !searchQuery || r.roomId.toLowerCase().includes(searchQuery.toLowerCase()) || (r.roomName && r.roomName.toLowerCase().includes(searchQuery.toLowerCase())) || (r.hostId && r.hostId.name && r.hostId.name.toLowerCase().includes(searchQuery.toLowerCase())))
                                        .sort((a, b) => favoriteRooms.includes(b._id) - favoriteRooms.includes(a._id))
                                        .map(room => {
                                            const isFavorite = favoriteRooms.includes(room._id);
                                            return (
                                                <div key={room._id} className={`bg-white dark:bg-dark-surface rounded-xl shadow-sm border p-5 hover:shadow-md transition cursor-pointer group flex flex-col justify-between ${isFavorite ? 'border-amber-300 ring-1 ring-amber-100 dark:border-amber-500/50 dark:ring-amber-900/30' : 'border-gray-200 dark:border-gray-800'}`} onClick={() => navigate(`/room/${room.roomId}`)}>
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                <Globe size={12} className="mr-1" /> Public
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => handleToggleFavorite(e, room.roomId)}
                                                                    className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${isFavorite ? 'text-amber-500' : 'text-gray-400'} opacity-0 group-hover:opacity-100 ${isFavorite ? 'opacity-100' : ''}`}
                                                                    title={isFavorite ? "Unpin Room" : "Pin Room"}
                                                                >
                                                                    <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
                                                                </button>
                                                                <span className="text-xs text-gray-500">{new Date(room.updatedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{room.roomName || `Board: ${room.roomId}`}</h4>
                                                        {room.roomName && <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-mono">ID: {room.roomId}</p>}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-blue-500">
                                                                {room.hostId?.name?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Host: {room.hostId?.name || 'Unknown'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-end">
                                                        <span className="text-primary-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 text-sm font-medium">
                                                            Join <ArrowRight size={16} />
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            ) : (
                                <div className="text-center bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                                    <p className="text-gray-500 dark:text-gray-400">There are no public boards available right now.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'vault' && (
                        <div className="animate-fade-in-up">
                            {fetchingNotes ? (
                                <div className="text-center text-gray-500 py-8">Unlocking Vault...</div>
                            ) : savedNotes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {savedNotes.map(note => (
                                        <div key={note._id} className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-5 hover:shadow-md transition cursor-pointer group flex flex-col justify-between" onClick={() => navigate(`/room/${note.roomId}`)}>
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded-md">
                                                        <Lock size={12} /> Encrypted Note
                                                    </span>
                                                    <span className="text-xs text-amber-700">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="text-md font-bold text-amber-900 mt-2 mb-2 line-clamp-1">Board: {note.roomId}</h4>
                                                <p className="text-sm text-amber-800/80 whitespace-pre-wrap line-clamp-4 font-serif bg-amber-100/50 p-2 rounded-lg italic">
                                                    {note.content}
                                                </p>
                                            </div>
                                            <div className="mt-4 flex justify-between items-center">
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditNoteModalData(note); }} className="p-1.5 text-gray-500 hover:bg-amber-100 hover:text-amber-700 rounded-md transition-colors" title="Edit Note">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={(e) => handleDeleteNote(e, note.roomId)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete from Vault">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <span className="text-amber-600 group-hover:translate-x-1 transition-transform text-xs font-semibold flex items-center gap-1">
                                                    Return to Room <ArrowRight size={14} />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center bg-white rounded-xl border border-gray-200 p-8">
                                    <p className="text-gray-500">Your vault is empty. Save personal notes during a session and they will appear here.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <CreateRoomModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateRoomSubmit}
                />
                <EditNoteModal
                    isOpen={!!editNoteModalData}
                    onClose={() => setEditNoteModalData(null)}
                    note={editNoteModalData}
                    onSave={handleSaveNote}
                />
            </main>
        </div>
    );
};

export default Dashboard;
