import { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown } from 'lucide-react';

const ParticipantList = ({ participants }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-x-3 bg-gray-50/80 dark:bg-dark-surface px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Users size={16} className="text-primary-500" />
                    <span>{participants.length}</span>
                </div>

                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                <div className="flex -space-x-1 items-center">
                    {participants.slice(0, 3).map((p, i) => (
                        <div
                            key={i}
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 border-2 border-white dark:border-dark-surface flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            title={p.name}
                        >
                            {p.name.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {participants.length > 3 && (
                        <div className="w-7 h-7 z-10 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-dark-surface flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                            +{participants.length - 3}
                        </div>
                    )}
                    <ChevronDown size={14} className={`ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-56 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-50 animate-fade-in-up">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Participants ({participants.length})</h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {participants.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col overflow-hidden leading-tight">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParticipantList;
