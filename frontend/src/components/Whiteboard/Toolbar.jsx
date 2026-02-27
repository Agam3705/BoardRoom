import useCanvasStore from '../../store/canvasStore';
import { MousePointer2, Hand, PenTool, Eraser, Trash2, Undo2, Redo2, Download, Square, Circle, ArrowUpRight, History, Triangle, Minus, Highlighter, Type, Image as ImageIcon, Option, Scissors, PaintBucket, Table } from 'lucide-react';
import { useState } from 'react';

import { socket } from '../../lib/socket';

const Toolbar = ({ handleClear, handleUndo, handleRedo, handleDownload, handleTimeTravel, roomId }) => {
    const { tool, setTool, color, setColor, brushSize, setBrushSize, history, historyStep, elements, setElements } = useCanvasStore();
    const [isTimeMachineOpen, setIsTimeMachineOpen] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const newElement = {
                id: 'el_' + Date.now() + Math.random().toString(36).substr(2, 5),
                tool: 'image',
                src: reader.result,
                x: window.innerWidth / 2 - 100,
                y: window.innerHeight / 2 - 100,
                width: 200,
                height: 200,
                scaleX: 1, scaleY: 1, rotation: 0
            };
            const newElements = [...elements, newElement];
            setElements(newElements, true);
            socket.emit('sync_board', { roomId, elements: newElements });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col items-center gap-4 z-50 w-full h-full relative">
            {/* Main Toolbar */}
            <div className="bg-white dark:bg-dark-surface dark:border-r dark:border-gray-800 py-2 shadow-sm flex flex-col items-center gap-2 w-full h-full overflow-hidden transition-colors duration-200">

                {/* Tools */}
                <div className="grid grid-cols-2 bg-gray-100 dark:bg-dark-bg p-1 rounded-xl gap-0.5">
                    <button
                        onClick={() => setTool('select')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'select' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Select Tool"
                    >
                        <MousePointer2 size={20} />
                    </button>
                    <button
                        onClick={() => setTool('hand')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'hand' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Pan Tool"
                    >
                        <Hand size={20} />
                    </button>
                    <button
                        onClick={() => setTool('pencil')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'pencil' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Pencil"
                    >
                        <PenTool size={20} />
                    </button>
                    <button
                        onClick={() => setTool('text')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'text' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Text"
                    >
                        <Type size={20} />
                    </button>
                    <button
                        onClick={() => setTool('rect')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'rect' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Rectangle"
                    >
                        <Square size={20} />
                    </button>
                    <button
                        onClick={() => setTool('circle')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'circle' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Circle"
                    >
                        <Circle size={20} />
                    </button>
                    <button
                        onClick={() => setTool('triangle')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'triangle' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Triangle"
                    >
                        <Triangle size={20} />
                    </button>
                    <button
                        onClick={() => setTool('line')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'line' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Line"
                    >
                        <Minus size={20} />
                    </button>
                    <button
                        onClick={() => setTool('arrow')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'arrow' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Arrow"
                    >
                        <ArrowUpRight size={20} />
                    </button>
                    <button
                        onClick={() => setTool('highlighter')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'highlighter' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Highlighter"
                    >
                        <Highlighter size={20} />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'eraser' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Object Eraser"
                    >
                        <Scissors size={20} />
                    </button>
                    <button
                        onClick={() => setTool('white-eraser')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'white-eraser' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="White Pen"
                    >
                        <Eraser size={20} />
                    </button>
                    <button
                        onClick={() => setTool('curve')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'curve' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Curved Line"
                    >
                        <Option size={20} />
                    </button>
                    <button
                        onClick={() => setTool('bucket')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'bucket' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Fill Color"
                    >
                        <PaintBucket size={20} />
                    </button>
                    <button
                        onClick={() => setTool('table')}
                        className={`p-1.5 rounded-lg transition-all ${tool === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                        title="Create Table"
                    >
                        <Table size={20} />
                    </button>

                    <label className="p-1.5 rounded-lg transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white dark:hover:bg-gray-800 cursor-pointer flex justify-center w-full" title="Upload Image">
                        <input type="file" accept="image/png, image/jpeg, image/gif" className="hidden" onChange={handleImageUpload} />
                        <ImageIcon size={20} />
                    </label>
                </div>

                <div className="h-px w-full bg-gray-200 dark:bg-gray-800"></div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-2 p-1">
                    {['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map((c) => (
                        <button
                            key={c}
                            onClick={() => { setTool('pencil'); setColor(c); }}
                            className={`w-8 h-8 rounded-full shadow-sm transition-transform ${color === c && tool === 'pencil' ? 'scale-125 ring-2 ring-offset-2 ring-primary-500' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                            title={c}
                        />
                    ))}
                    {/* Custom Color */}
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm hover:scale-110 transition-transform cursor-pointer border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => { setTool('pencil'); setColor(e.target.value); }}
                            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-0"
                            title="Custom Color"
                        />
                        <div className="w-full h-full" style={{ backgroundColor: color }}></div>
                    </div>
                </div>

                <div className="h-px w-8 bg-gray-200 dark:bg-gray-800"></div>

                {/* Brush Size */}
                <div className="flex flex-col items-center gap-1 w-full px-2 py-2">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider">STROKE: {brushSize}</span>
                    <input
                        type="range"
                        min="1"
                        max="30"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-full h-1.5 accent-primary-500 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"
                    />
                </div>

                <div className="h-px w-8 bg-gray-200 dark:bg-gray-800"></div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-1 text-gray-600 dark:text-gray-400 w-full px-1 mb-2">
                    <button onClick={handleUndo} className="p-1.5 flex justify-center hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white rounded-lg transition-colors" title="Undo (Ctrl+Z)">
                        <Undo2 size={20} />
                    </button>
                    <button onClick={handleRedo} className="p-1.5 flex justify-center hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white rounded-lg transition-colors" title="Redo (Ctrl+Y)">
                        <Redo2 size={20} />
                    </button>
                    <button onClick={handleClear} className="p-1.5 flex justify-center hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors" title="Clear Board">
                        <Trash2 size={20} />
                    </button>
                    <button onClick={() => setIsTimeMachineOpen(!isTimeMachineOpen)} className={`p-1.5 flex justify-center rounded-lg transition-colors ${isTimeMachineOpen ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white'}`} title="Time Machine">
                        <History size={20} />
                    </button>
                    <button onClick={handleDownload} className="p-1.5 col-span-2 flex justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors" title="Save as Image">
                        <Download size={20} />
                    </button>
                </div>

            </div>

            {/* Time Machine Slider Panel */}
            {isTimeMachineOpen && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-surface px-6 sm:px-8 py-4 sm:py-5 rounded-3xl shadow-2xl border border-gray-100/50 dark:border-gray-800/80 backdrop-blur-md flex flex-col items-center w-[90vw] sm:w-[400px] max-w-[400px] animate-fade-in z-50">
                    <div className="flex justify-between w-full mb-3">
                        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-2"><History size={16} /> Time Machine</span>
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400 font-bold bg-gray-100 dark:bg-dark-bg px-2 py-0.5 rounded-md">{historyStep} / {history.length - 1}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={Math.max(0, history.length - 1)}
                        value={historyStep}
                        onChange={(e) => handleTimeTravel(parseInt(e.target.value))}
                        className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer outline-none transition-all hover:bg-gray-300 dark:hover:bg-gray-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                    />
                </div>
            )}
        </div>
    );
};

export default Toolbar;
