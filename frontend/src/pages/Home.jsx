import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { PenTool, Users, Share2, Zap } from 'lucide-react';

const Home = () => {
    const { userInfo } = useAuthStore();

    if (userInfo) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="bg-white min-h-screen font-sans text-gray-900 selection:bg-primary-100 selection:text-primary-900">
            {/* Navbar */}
            <nav className="border-b border-gray-100 backdrop-blur-md bg-white/80 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary-500 text-white p-2 rounded-xl shadow-lg shadow-primary-500/30">
                                <PenTool size={24} />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-gray-900">BoardRoom</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                Log in
                            </Link>
                            <Link to="/register" className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 shadow-xl shadow-gray-900/20 transition-all hover:scale-105 active:scale-95">
                                Sign up free
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-24 pb-32">
                {/* Dynamic Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl z-0 pointer-events-none">
                    <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute top-20 -right-20 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 mb-8 leading-[1.1]">
                        Draw together, <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-blue-500">
                            anywhere.
                        </span>
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-xl md:text-2xl text-gray-500 leading-relaxed font-medium">
                        The real-time collaborative whiteboard built for modern teams. Brainstorm, plan, and create without limits.
                    </p>
                    <div className="mt-10 flex justify-center gap-4">
                        <Link to="/register" className="px-8 py-4 rounded-full text-lg font-bold text-white bg-primary-500 hover:bg-primary-600 shadow-2xl shadow-primary-500/40 transition-all hover:-translate-y-1 hover:shadow-primary-600/50 active:scale-95 flex items-center gap-2">
                            Start drawing <Zap size={20} className="fill-current" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Feature Section */}
            <div className="bg-gray-50 py-24 sm:py-32 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-20 text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything you need to collaborate</h2>
                        <p className="mt-4 text-lg text-gray-600">Built with performance and user experience in mind, just like your favorite design tools.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 transform transition-all hover:-translate-y-2">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <Users size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Sync</h3>
                            <p className="text-gray-600 leading-relaxed">See cursors move and strokes flow instantly as your team draws together from anywhere in the world.</p>
                        </div>
                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 transform transition-all hover:-translate-y-2">
                            <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mb-6">
                                <PenTool size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Fluid Drawing</h3>
                            <p className="text-gray-600 leading-relaxed">Experience lag-free canvas interaction with dynamic brush sizes, colors, and an intuitive eraser tool.</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 transform transition-all hover:-translate-y-2">
                            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                <Share2 size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Sharing</h3>
                            <p className="text-gray-600 leading-relaxed">Create a room automatically and share the secure link with your team. No software installation required.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
