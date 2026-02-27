import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { socket } from '../../lib/socket';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

const VideoElement = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on('stream', stream => {
            if (ref.current) ref.current.srcObject = stream;
        });
    }, [peer]);

    return (
        <video
            playsInline
            autoPlay
            ref={ref}
            className="w-full h-full object-cover bg-gray-900"
        />
    );
};

const VideoChat = ({ roomId, isExpanded }) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef(socket);
    const userVideo = useRef();
    const peersRef = useRef([]);

    // Local Media State
    const [stream, setStream] = useState(null);
    const [audioMuted, setAudioMuted] = useState(false);
    const [videoMuted, setVideoMuted] = useState(false);
    const [mediaError, setMediaError] = useState(false);

    useEffect(() => {
        let currentStream;
        let isMounted = true;
        const socketObj = socketRef.current;

        const STUN_CONFIG = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        };

        let handlers = {};

        const initMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!isMounted) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                setStream(mediaStream);
                currentStream = mediaStream;

                if (userVideo.current) {
                    userVideo.current.srcObject = mediaStream;
                }

                handlers.handleAllVideoUsers = (users) => {
                    const peers = [];
                    peersRef.current.forEach(p => p.peer.destroy());
                    peersRef.current = [];

                    users.forEach(userID => {
                        const peer = createPeer(userID, socketObj.id, mediaStream, STUN_CONFIG);
                        peersRef.current.push({ peerID: userID, peer });
                        peers.push({ peerID: userID, peer });
                    });
                    setPeers(peers);
                };

                handlers.handleUserJoined = payload => {
                    const existing = peersRef.current.find(p => p.peerID === payload.callerID);
                    if (existing) return;

                    const peer = addPeer(payload.signal, payload.callerID, mediaStream, STUN_CONFIG);
                    peersRef.current.push({ peerID: payload.callerID, peer });
                    setPeers(users => [...users, { peerID: payload.callerID, peer }]);
                };

                handlers.handleReceivingReturnedSignal = payload => {
                    const item = peersRef.current.find(p => p.peerID === payload.id);
                    if (item) {
                        item.peer.signal(payload.signal);
                    }
                };

                handlers.handleUserLeft = (id) => {
                    const peerObj = peersRef.current.find(p => p.peerID === id);
                    if (peerObj) peerObj.peer.destroy();
                    peersRef.current = peersRef.current.filter(p => p.peerID !== id);
                    setPeers(users => users.filter(p => p.peerID !== id));
                };

                socketObj.on('all_video_users', handlers.handleAllVideoUsers);
                socketObj.on('user_joined_video', handlers.handleUserJoined);
                socketObj.on('receiving_returned_signal', handlers.handleReceivingReturnedSignal);
                socketObj.on('user_left_video', handlers.handleUserLeft);

                socketObj.emit('join_video', roomId);
            } catch (err) {
                console.error("Failed to get local media", err);
                if (isMounted) setMediaError(true);
            }
        };

        if (roomId) {
            initMedia();
        }

        return () => {
            isMounted = false;
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            peersRef.current.forEach(p => p.peer.destroy());
            peersRef.current = [];

            if (handlers.handleAllVideoUsers) {
                socketObj.off('all_video_users', handlers.handleAllVideoUsers);
                socketObj.off('user_joined_video', handlers.handleUserJoined);
                socketObj.off('receiving_returned_signal', handlers.handleReceivingReturnedSignal);
                socketObj.off('user_left_video', handlers.handleUserLeft);
            }

            socketObj.emit('leave_video', roomId);
            setPeers([]);
        };
    }, [roomId]);

    function createPeer(userToSignal, callerID, stream, config) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config
        });

        peer.on('signal', signal => {
            socketRef.current.emit('sending_signal', { userToSignal, callerID, signal });
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream, config) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config
        });

        peer.on('signal', signal => {
            socketRef.current.emit('returning_signal', { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    const toggleAudio = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = audioMuted;
            setAudioMuted(!audioMuted);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks()[0].enabled = videoMuted;
            setVideoMuted(!videoMuted);
        }
    };

    if (mediaError) {
        return <div className="p-4 text-xs text-red-500 bg-red-50 rounded-lg">Camera/Mic access denied or unavailable.</div>;
    }

    return (
        <div className={`flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden transition-all duration-300 ${isExpanded ? 'p-2' : ''}`}>
            <div className="flex-1 overflow-y-auto custom-scrollbar-dark grid grid-cols-1 gap-2 p-2">
                {/* Local Video */}
                <div className="relative group rounded-lg overflow-hidden bg-black aspect-video">
                    <video playsInline muted autoPlay ref={userVideo} className="w-full h-full object-cover transform -scale-x-100" />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs backdrop-blur-sm">
                        You {audioMuted && <MicOff size={10} className="inline ml-1 text-red-400" />}
                    </div>
                </div>

                {/* Remote Videos */}
                {peers.map((peerObj) => (
                    <div key={peerObj.peerID} className="relative rounded-lg overflow-hidden bg-black aspect-video">
                        <VideoElement peer={peerObj.peer} />
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3 p-3 bg-gray-900 border-t border-gray-800">
                <button
                    onClick={toggleAudio}
                    className={`p-2.5 rounded-full transition-colors shadow-sm ${audioMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                >
                    {audioMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button
                    onClick={toggleVideo}
                    className={`p-2.5 rounded-full transition-colors shadow-sm ${videoMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                >
                    {videoMuted ? <VideoOff size={18} /> : <Video size={18} />}
                </button>
            </div>
        </div>
    );
};

export default VideoChat;
