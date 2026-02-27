import { useState, useEffect, useRef } from 'react';
import { X, Save, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';

const PersonalNotes = ({ isOpen, onClose, roomId }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const saveTimeoutRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            const fetchNote = async () => {
                try {
                    setLoading(true);
                    const { data } = await api.get(`/notes/${roomId}`);
                    setContent(data.content || '');
                } catch (err) {
                    console.error('Failed to load note', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchNote();
        }
    }, [isOpen, roomId]);

    const handleChange = (e) => {
        setContent(e.target.value);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/notes/${roomId}`, { content });
            setLastSaved(new Date());
            toast.success('Note securely saved to Vault', {
                position: 'bottom-right'
            });
        } catch (err) {
            console.error('Failed to save note', err);
            toast.error('Failed to save note. Please try again.', {
                position: 'bottom-right'
            });
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="h-full w-full bg-white dark:bg-dark-surface dark:border-l dark:border-gray-800 flex flex-col z-40 animate-fade-in-right transition-colors duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-dark-surface/50">
                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold">
                    <Edit3 size={18} />
                    <h3>Personal Notes</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 p-4 relative">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary-500" size={24} />
                    </div>
                ) : (
                    <textarea
                        value={content}
                        onChange={handleChange}
                        placeholder="Jot down your private thoughts here... Only you can see this."
                        className="w-full h-full resize-none outline-none text-gray-700 dark:text-white bg-transparent placeholder-gray-400 dark:placeholder-gray-500"
                    />
                )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-dark-surface border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors disabled:opacity-75"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        {saving ? 'Saving...' : 'Save Note'}
                    </button>
                    {lastSaved && !saving && (
                        <span className="text-green-600">Saved {lastSaved.toLocaleTimeString()}</span>
                    )}
                </div>
                <span>Syncs to Dashboard Vault</span>
            </div>
        </div>
    );
};

export default PersonalNotes;
