import { useState, useEffect } from 'react';
import { FileText, X, Save } from 'lucide-react';
import api from '../../lib/axios';

const PersonalNotes = ({ isOpen, toggleNotes }) => {
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchNotes = async () => {
                try {
                    const { data } = await api.get('/notes');
                    setContent(data.content || '');
                } catch (error) {
                    console.error('Failed to fetch notes', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchNotes();
        }
    }, [isOpen]);

    // Auto-save logic (debounced)
    useEffect(() => {
        if (!isOpen || loading) return;

        const timer = setTimeout(async () => {
            setSaving(true);
            try {
                await api.put('/notes', { content });
            } catch (error) {
                console.error('Failed to save notes', error);
            } finally {
                setTimeout(() => setSaving(false), 500);
            }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [content, isOpen, loading]);

    if (!isOpen) return null;

    return (
        <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform border-l border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                    <FileText size={18} className="text-primary-600" />
                    Personal Notes
                </div>
                <div className="flex items-center gap-3">
                    {saving && <span className="text-xs text-gray-400 flex items-center gap-1"><Save size={12} /> Saving...</span>}
                    <button onClick={toggleNotes} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 bg-gray-50/30">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading notes...</div>
                ) : (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Jot down your brilliant ideas here..."
                        className="w-full h-full p-4 bg-white border border-gray-200 rounded-lg shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono text-sm leading-relaxed text-gray-700"
                    />
                )}
            </div>
        </div>
    );
};

export default PersonalNotes;
