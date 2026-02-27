import { useEffect, useState } from 'react';
import { socket } from '../../lib/socket';

const ReactionOverlay = () => {
    const [reactions, setReactions] = useState([]);

    useEffect(() => {
        const handleReaction = (data) => {
            const id = Date.now() + Math.random().toString();
            const newReaction = {
                id,
                emoji: data.emoji,
                userName: data.userName,
                // slight random offset
                offsetX: (Math.random() - 0.5) * 40,
                offsetY: (Math.random() - 0.5) * 20
            };

            setReactions(prev => [...prev, newReaction]);

            // Remove after animation completes
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== id));
            }, 2000);
        };

        const handleLocalReaction = (e) => {
            handleReaction(e.detail);
        };

        socket.on('reaction', handleReaction);
        window.addEventListener('local_reaction', handleLocalReaction);

        return () => {
            socket.off('reaction', handleReaction);
            window.removeEventListener('local_reaction', handleLocalReaction);
        };
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {reactions.map((reaction) => (
                <div
                    key={reaction.id}
                    className="absolute animate-float-up flex flex-col items-center gap-1"
                    style={{
                        left: '50%',
                        bottom: '120px',
                        transform: `translate(calc(-50% + ${reaction.offsetX}px), ${reaction.offsetY}px)`
                    }}
                >
                    <span className="text-4xl">{reaction.emoji}</span>
                    {reaction.userName && (
                        <span className="text-[10px] font-bold text-gray-700 bg-white/90 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                            {reaction.userName}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ReactionOverlay;
