import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Transformer, Rect, Ellipse, Arrow, RegularPolygon, Text, Image as KonvaImage, Group, Circle } from 'react-konva';
import useImage from 'use-image';
import useCanvasStore from '../../store/canvasStore';
import useAuthStore from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { socket } from '../../lib/socket';

const URLImage = ({ image }) => {
    const [img] = useImage(image.src);
    return (
        <KonvaImage
            image={img}
            id={image.id}
            x={image.x}
            y={image.y}
            width={image.width}
            height={image.height}
            scaleX={image.scaleX || 1}
            scaleY={image.scaleY || 1}
            rotation={image.rotation || 0}
            draggable={image.draggable}
            onClick={image.onClick}
            onTap={image.onTap}
            onDragEnd={image.onDragEnd}
            onTransformEnd={image.onTransformEnd}
        />
    );
};

const Canvas = ({ roomId }) => {
    const containerRef = useRef(null);
    const stageRef = useRef(null);
    const layerRef = useRef(null);
    const trRef = useRef(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [cursors, setCursors] = useState({});

    // Text editing state
    const [textInput, setTextInput] = useState(null);

    // Auto-resizing Stage
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Stage properties for infinite canvas
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);

    // Selection state
    const [selectedIds, setSelectedIds] = useState([]);

    const { tool, color, brushSize, elements, setElements } = useCanvasStore();
    const { userInfo } = useAuthStore();
    const { theme } = useTheme();

    // For syncing real-time drawing without adding to elements array fully yet
    const currentLine = useRef(null);

    // Handle Selection Transformer
    useEffect(() => {
        if (tool === 'select' && selectedIds.length > 0 && layerRef.current && trRef.current) {
            const elementsById = elements.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
            const nodes = selectedIds.map(id => layerRef.current.findOne('#' + id)).filter(n => n && elementsById[n.id()]?.tool !== 'table');
            trRef.current.nodes(nodes);
            trRef.current.getLayer().batchDraw();
        } else if (trRef.current) {
            trRef.current.nodes([]);
            trRef.current.getLayer().batchDraw();
        }
    }, [selectedIds, elements, tool]);

    // Pan / Zoom Logic
    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.05;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();

        const pointerPosition = stage.getPointerPosition();
        if (!pointerPosition) return;

        const mousePointTo = {
            x: (pointerPosition.x - stage.x()) / oldScale,
            y: (pointerPosition.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        if (newScale < 0.1 || newScale > 5) return;

        setStageScale(newScale);
        setStagePos({
            x: pointerPosition.x - mousePointTo.x * newScale,
            y: pointerPosition.y - mousePointTo.y * newScale,
        });
    };

    const getRelativePointerPosition = (stage) => {
        const pointerPosition = stage.getPointerPosition();
        const scale = stage.scaleX();
        const position = stage.position();
        return {
            x: (pointerPosition.x - position.x) / scale,
            y: (pointerPosition.y - position.y) / scale
        };
    };

    // Drawing Logic
    const handleMouseDown = (e) => {
        if (e.evt.button === 1 || tool === 'hand') return;

        // Finish text editing if clicking elsewhere
        if (textInput) {
            handleTextSubmit();
            return;
        }

        // Selection Tool
        if (tool === 'select') {
            const isClickOnEmpty = e.target === e.target.getStage();
            if (isClickOnEmpty) {
                setSelectedIds([]);
            }
            return;
        }

        setIsDrawing(true);
        setSelectedIds([]);
        const stage = e.target.getStage();
        const pos = getRelativePointerPosition(stage);

        if (tool === 'text') {
            setIsDrawing(false);
            setTextInput({
                id: 'el_' + Date.now() + Math.random().toString(36).substr(2, 5),
                x: pos.x,
                y: pos.y,
                val: '',
                color,
                brushSize: brushSize * 4 // Scale up brush for font size proportionally
            });
            return;
        }

        if (tool === 'eraser') {
            const absolutePos = stage.getPointerPosition();
            const shape = stage.getIntersection(absolutePos);
            if (shape && shape.id() && shape.className !== 'Transformer') {
                const actualId = shape.id().replace('sh-', '');
                const newElements = elements.filter(el => el.id !== actualId && el.id !== shape.id());
                if (newElements.length !== elements.length) {
                    setElements(newElements, true);
                    socket.emit('sync_board', { roomId, elements: newElements });
                }
            }
            return;
        }

        if (tool === 'bucket') {
            const absolutePos = stage.getPointerPosition();
            const shape = stage.getIntersection(absolutePos);
            let targetId = null;

            if (shape && shape.id() && shape.className !== 'Transformer') {
                targetId = shape.id().replace('sh-', '');
            }

            let targetElement = targetId ? elements.find(el => el.id === targetId || el.id === shape.id()) : null;

            // Point-in-Polygon for unclosed freehand loops
            if (!targetElement && layerRef.current) {
                const isPointInPolygon = (point, vs) => {
                    let x = point[0], y = point[1];
                    let inside = false;
                    for (let i = 0, j = vs.length - 2; i < vs.length; i += 2) {
                        let xi = vs[i], yi = vs[i + 1];
                        let xj = vs[j], yj = vs[j + 1];
                        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                        if (intersect) inside = !inside;
                        j = i;
                    }
                    return inside;
                };

                for (let i = elements.length - 1; i >= 0; i--) {
                    const el = elements[i];
                    if ((el.tool === 'pencil' || el.tool === 'highlighter') && el.points && el.points.length > 4) {
                        const node = layerRef.current.findOne('#' + el.id);
                        if (node) {
                            const localPos = node.getAbsoluteTransform().copy().invert().point(absolutePos);
                            if (isPointInPolygon([localPos.x, localPos.y], el.points)) {
                                targetElement = el;
                                break;
                            }
                        }
                    }
                }
            }

            setIsDrawing(false);

            if (targetElement) {
                const newElements = elements.map(el => {
                    if (el.id === targetElement.id) {
                        return { ...el, fillColor: color, color: color };
                    }
                    return el;
                });
                setElements(newElements, true);
                socket.emit('sync_board', { roomId, elements: newElements });
            } else {
                const bgFill = {
                    id: 'el_' + Date.now() + Math.random().toString(36).substr(2, 5),
                    tool: 'rect',
                    x: -dimensions.width * 5,
                    y: -dimensions.height * 5,
                    width: dimensions.width * 10,
                    height: dimensions.height * 10,
                    color: color,
                    fillColor: color,
                    brushSize: 0,
                    scaleX: 1, scaleY: 1, rotation: 0
                };
                const newElements = [bgFill, ...elements];
                setElements(newElements, true);
                socket.emit('sync_board', { roomId, elements: newElements });
            }
            return;
        }

        if (tool === 'table') {
            if (e.target && (e.target.name() === 'table-controls' || (e.target.parent && e.target.parent.name() === 'table-controls'))) {
                return;
            }
            setIsDrawing(false);
            const newTable = {
                id: 'el_' + Date.now() + Math.random().toString(36).substr(2, 5),
                tool: 'table',
                x: pos.x,
                y: pos.y,
                rows: 2,
                cols: 2,
                cellWidth: 100,
                cellHeight: 40,
                color,
                data: Array(2).fill(null).map(() => Array(2).fill('')), // 2D array of text
                scaleX: 1, scaleY: 1, rotation: 0
            };
            const newElements = [...elements, newTable];
            setElements(newElements, true);
            socket.emit('sync_board', { roomId, elements: newElements });
            return;
        }

        currentLine.current = {
            id: 'el_' + Date.now() + Math.random().toString(36).substr(2, 5),
            tool,
            color: tool === 'white-eraser' ? '#ffffff' : color,
            brushSize,
            points: [pos.x, pos.y],
            x: (tool === 'rect' || tool === 'circle' || tool === 'triangle') ? pos.x : 0,
            y: (tool === 'rect' || tool === 'circle' || tool === 'triangle') ? pos.y : 0,
            width: 0, height: 0, scaleX: 1, scaleY: 1, rotation: 0
        };
    };

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pos = getRelativePointerPosition(stage);

        socket.emit('cursor_move', {
            roomId,
            cursorData: { x: pos.x, y: pos.y, color: userInfo.color || '#14b8a6', name: userInfo.name }
        });

        if (!isDrawing || tool === 'select' || tool === 'hand') return;

        if (tool === 'eraser') {
            const absolutePos = stage.getPointerPosition();
            const shape = stage.getIntersection(absolutePos);
            if (shape && shape.className !== 'Transformer') {
                const tableGroup = shape.findAncestor('.table-group');
                const actualId = tableGroup ? tableGroup.id() : (shape.id() ? shape.id().replace('sh-', '') : null);

                if (actualId) {
                    const newElements = elements.filter(el => el.id !== actualId);
                    if (newElements.length !== elements.length) {
                        setElements(newElements, true);
                        socket.emit('sync_board', { roomId, elements: newElements });
                    }
                }
            }
            return;
        }

        if (tool === 'pencil' || tool === 'highlighter' || tool === 'white-eraser') {
            currentLine.current.points = [...currentLine.current.points, pos.x, pos.y];
        } else if (tool === 'rect' || tool === 'circle' || tool === 'triangle') {
            currentLine.current.width = pos.x - currentLine.current.x;
            currentLine.current.height = pos.y - currentLine.current.y;
        } else if (tool === 'arrow' || tool === 'line') {
            currentLine.current.points = [
                currentLine.current.points[0],
                currentLine.current.points[1],
                pos.x,
                pos.y
            ];
        } else if (tool === 'curve') {
            const startX = currentLine.current.points[0];
            const startY = currentLine.current.points[1];
            const dx = pos.x - startX;
            const dy = pos.y - startY;
            const midX = startX + dx / 2 - dy * 0.25;
            const midY = startY + dy / 2 + dx * 0.25;

            currentLine.current.points = [
                startX, startY,
                midX, midY,
                pos.x, pos.y
            ];
        }

        socket.emit('draw', { roomId, drawData: currentLine.current });

        // Force temporary re-render
        setElements([...elements], false);
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentLine.current && (currentLine.current.points?.length > 2 || currentLine.current.width !== 0)) {
            setElements([...elements, currentLine.current], true);
        }
        currentLine.current = null;
    };

    const handleTextSubmit = () => {
        if (textInput && textInput.val !== undefined) {
            if (textInput.tableId) {
                // Updating a table cell
                const tableEl = elements.find(el => el.id === textInput.tableId);
                if (tableEl) {
                    const newData = [...tableEl.data];
                    newData[textInput.r] = [...newData[textInput.r]];
                    newData[textInput.r][textInput.c] = textInput.val;
                    updateElement(tableEl.id, { data: newData });
                }
            } else if (textInput.val.trim()) {
                // Create brand new standalone text node
                const newElement = {
                    id: textInput.id,
                    tool: 'text',
                    x: textInput.x,
                    y: textInput.y,
                    text: textInput.val,
                    color: textInput.color,
                    fontSize: textInput.brushSize,
                    width: 0, height: 0, scaleX: 1, scaleY: 1, rotation: 0
                };
                const newElements = [...elements, newElement];
                setElements(newElements, true);
                socket.emit('sync_board', { roomId, elements: newElements });
            }
        }
        setTextInput(null);
    };

    // Element Manipulation
    const updateElement = (id, newProps) => {
        const newElements = elements.map(el => el.id === id ? { ...el, ...newProps } : el);
        setElements(newElements, true);
        socket.emit('sync_board', { roomId, elements: newElements });
    };

    // Sockets Lifecycle
    useEffect(() => {
        socket.on('draw', (data) => {
            const state = useCanvasStore.getState();
            const existsIndex = state.elements.findIndex(el => el.id === data.id);
            if (existsIndex !== -1) {
                const newElements = [...state.elements];
                newElements[existsIndex] = data;
                state.setElements(newElements, false);
            } else {
                state.setElements([...state.elements, data], false);
            }
        });
        socket.on('sync_board', (syncElements) => useCanvasStore.getState().setElements(syncElements, false));
        socket.on('clear_board', () => { useCanvasStore.getState().clearCanvas(); setSelectedIds([]); });

        socket.on('cursor_move', (data) => {
            setCursors(prev => ({ ...prev, [data.socketId]: data }));
            setTimeout(() => {
                setCursors(prev => {
                    const next = { ...prev };
                    delete next[data.socketId];
                    return next;
                });
            }, 3000);
        });

        return () => {
            socket.off('draw'); socket.off('sync_board');
            socket.off('clear_board'); socket.off('cursor_move');
        };
    }, []);

    // Delete selected elements
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
                const newElements = elements.filter(el => !selectedIds.includes(el.id));
                setElements(newElements, true);
                socket.emit('sync_board', { roomId, elements: newElements });
                setSelectedIds([]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, elements, setElements, roomId]);

    const displayElements = currentLine.current ? [...elements, currentLine.current] : elements;

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-gray-50 dark:bg-dark-bg transition-colors duration-200 bg-dot-grid w-full h-full">
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                draggable={tool === 'hand'}
                x={stagePos.x}
                y={stagePos.y}
                scaleX={stageScale}
                scaleY={stageScale}
                className={tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : (tool === 'select' ? 'cursor-default' : 'cursor-crosshair')}
            >
                <Layer ref={layerRef}>
                    {displayElements.map((el, i) => {
                        const displayColor = el.tool === 'white-eraser'
                            ? (theme === 'dark' ? '#121212' : '#f9fafb')
                            : ((theme === 'dark' && el.color === '#000000') ? '#ffffff' : el.color);

                        const commonProps = {
                            id: el.id,
                            x: el.x || 0,
                            y: el.y || 0,
                            scaleX: el.scaleX || 1,
                            scaleY: el.scaleY || 1,
                            rotation: el.rotation || 0,
                            stroke: displayColor,
                            strokeWidth: el.brushSize,
                            globalCompositeOperation: el.tool === 'eraser' ? 'destination-out' : 'source-over',
                            draggable: tool === 'select',
                            onClick: (e) => {
                                if (tool === 'select') {
                                    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
                                    if (metaPressed) {
                                        setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
                                    } else {
                                        setSelectedIds([el.id]);
                                    }

                                    // Z-Index Auto Management: Bring to front (only if single selection to avoid array jumping)
                                    if (!metaPressed) {
                                        const newE = elements.filter(item => item.id !== el.id);
                                        newE.push(el);
                                        setElements(newE, true);
                                        socket.emit('sync_board', { roomId, elements: newE });
                                    }
                                }
                            },
                            onTap: (e) => {
                                if (tool === 'select') {
                                    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
                                    if (metaPressed) {
                                        setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
                                    } else {
                                        setSelectedIds([el.id]);
                                    }

                                    if (!metaPressed) {
                                        const newE = elements.filter(item => item.id !== el.id);
                                        newE.push(el);
                                        setElements(newE, true);
                                    }
                                }
                            },
                            onDragEnd: (e) => {
                                if (tool === 'select') {
                                    if (selectedIds.includes(el.id) && selectedIds.length > 1) {
                                        const newElements = [...elements];
                                        selectedIds.forEach(id => {
                                            const node = layerRef.current.findOne('#' + id);
                                            if (node) {
                                                const idx = newElements.findIndex(elem => elem.id === id);
                                                if (idx > -1) {
                                                    newElements[idx] = {
                                                        ...newElements[idx],
                                                        x: node.x(),
                                                        y: node.y()
                                                    };
                                                }
                                            }
                                        });
                                        setElements(newElements, true);
                                        socket.emit('sync_board', { roomId, elements: newElements });
                                    } else {
                                        updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                                    }
                                }
                            },
                            onTransformEnd: () => {
                                if (selectedIds.length > 0) {
                                    const newElements = [...elements];
                                    selectedIds.forEach(id => {
                                        const node = layerRef.current.findOne('#' + id);
                                        if (node) {
                                            const idx = newElements.findIndex(elem => elem.id === id);
                                            if (idx > -1) {
                                                newElements[idx] = {
                                                    ...newElements[idx],
                                                    x: node.x(),
                                                    y: node.y(),
                                                    scaleX: Math.max(node.scaleX(), 0.1),
                                                    scaleY: Math.max(node.scaleY(), 0.1),
                                                    rotation: node.rotation()
                                                };
                                            }
                                        }
                                    });
                                    setElements(newElements, true);
                                    socket.emit('sync_board', { roomId, elements: newElements });
                                }
                            }
                        };

                        if (el.tool === 'pencil' || el.tool === 'highlighter' || el.tool === 'curve' || el.tool === 'white-eraser') {
                            return <Line key={`sh-${el.id || i}`} {...commonProps} points={el.points || []} tension={0.5} lineCap="round" lineJoin="round" opacity={el.tool === 'highlighter' ? 0.4 : 1} strokeWidth={el.tool === 'highlighter' ? el.brushSize * 3 : el.brushSize} hitStrokeWidth={20} fill={el.fillColor || null} closed={!!el.fillColor} />;
                        } else if (el.tool === 'rect') {
                            return <Rect key={`sh-${el.id || i}`} {...commonProps} width={el.width || 0} height={el.height || 0} fill={el.fillColor || null} />;
                        } else if (el.tool === 'circle') {
                            return <Ellipse key={`sh-${el.id || i}`} {...commonProps} radiusX={Math.abs((el.width || 0) / 2)} radiusY={Math.abs((el.height || 0) / 2)} offsetX={-(el.width || 0) / 2} offsetY={-(el.height || 0) / 2} fill={el.fillColor || null} />;
                        } else if (el.tool === 'triangle') {
                            return <RegularPolygon key={`sh-${el.id || i}`} {...commonProps} sides={3} radius={Math.max(Math.abs(el.width || 0), Math.abs(el.height || 0))} offset={{ x: -(el.width || 0) / 2, y: -(el.height || 0) / 2 }} fill={el.fillColor || null} />;
                        } else if (el.tool === 'arrow') {
                            return <Arrow key={`sh-${el.id || i}`} {...commonProps} points={el.points || []} pointerLength={15} pointerWidth={15} />;
                        } else if (el.tool === 'line') {
                            return <Line key={`sh-${el.id || i}`} {...commonProps} points={el.points || []} lineCap="round" lineJoin="round" hitStrokeWidth={20} />;
                        } else if (el.tool === 'text') {
                            return <Text key={`sh-${el.id || i}`} {...commonProps} text={el.text || ''} fontSize={el.fontSize || 16} fill={displayColor} padding={5} strokeEnabled={false} />;
                        } else if (el.tool === 'table') {
                            const isSelected = selectedIds.includes(el.id);
                            const tableGroupProps = { ...commonProps };
                            delete tableGroupProps.stroke;
                            delete tableGroupProps.strokeWidth;
                            return (
                                <Group key={`sh-${el.id || i}`} name="table-group" {...tableGroupProps}>
                                    {Array.from({ length: el.rows }).map((_, r) => (
                                        Array.from({ length: el.cols }).map((_, c) => (
                                            <Group key={`cell-${r}-${c}`} x={c * el.cellWidth} y={r * el.cellHeight}>
                                                <Rect width={el.cellWidth} height={el.cellHeight} stroke={displayColor} strokeWidth={el.brushSize || 2} fill={el.fillColor || (theme === 'dark' ? '#1f2937' : '#ffffff')} />
                                                <Text
                                                    text={el.data?.[r]?.[c] || ''}
                                                    width={el.cellWidth} height={el.cellHeight}
                                                    padding={8} fill={displayColor} align="center" verticalAlign="middle"
                                                    onDblClick={() => {
                                                        if (tool === 'select') {
                                                            const pos = { x: el.x + (c * el.cellWidth), y: el.y + (r * el.cellHeight) };
                                                            setTextInput({
                                                                tableId: el.id,
                                                                r, c,
                                                                x: pos.x,
                                                                y: pos.y,
                                                                val: el.data?.[r]?.[c] || '',
                                                                color: el.color,
                                                                brushSize: el.brushSize * 4
                                                            });
                                                        }
                                                    }}
                                                />
                                            </Group>
                                        ))
                                    ))}
                                    {isSelected && (
                                        <Group name="table-controls">
                                            <Group
                                                name="table-controls"
                                                x={el.cols * el.cellWidth + 10}
                                                y={(el.rows * el.cellHeight) / 2 - 10}
                                                onClick={(e) => {
                                                    e.cancelBubble = true;
                                                    const newTableData = el.data.map(row => [...row, '']);
                                                    updateElement(el.id, { cols: el.cols + 1, data: newTableData });
                                                }}
                                                onTap={(e) => {
                                                    e.cancelBubble = true;
                                                    const newTableData = el.data.map(row => [...row, '']);
                                                    updateElement(el.id, { cols: el.cols + 1, data: newTableData });
                                                }}
                                            >
                                                <Circle name="table-controls" radius={12} fill="#3b82f6" />
                                                <Text name="table-controls" text="+" fill="white" fontSize={16} fontStyle="bold" x={-5} y={-7} />
                                            </Group>
                                            <Group
                                                name="table-controls"
                                                x={(el.cols * el.cellWidth) / 2 - 10}
                                                y={el.rows * el.cellHeight + 10}
                                                onClick={(e) => {
                                                    e.cancelBubble = true;
                                                    const newRow = Array(el.cols).fill('');
                                                    updateElement(el.id, { rows: el.rows + 1, data: [...el.data, newRow] });
                                                }}
                                                onTap={(e) => {
                                                    e.cancelBubble = true;
                                                    const newRow = Array(el.cols).fill('');
                                                    updateElement(el.id, { rows: el.rows + 1, data: [...el.data, newRow] });
                                                }}
                                            >
                                                <Circle name="table-controls" radius={12} fill="#3b82f6" />
                                                <Text name="table-controls" text="+" fill="white" fontSize={16} fontStyle="bold" x={-5} y={-7} />
                                            </Group>
                                        </Group>
                                    )}
                                </Group>
                            );
                        } else if (el.tool === 'image') {
                            return <URLImage key={`sh-${el.id || i}`} image={{ ...el, ...commonProps }} />;
                        }
                        return null;
                    })}
                    {tool === 'select' && selectedIds.length > 0 && (
                        <Transformer
                            ref={trRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                                return newBox;
                            }}
                        />
                    )}
                </Layer>
            </Stage>

            {/* Cursors Overlay */}
            {Object.values(cursors).map((cursor) => (
                <div
                    key={cursor.socketId}
                    className="pointer-events-none absolute top-0 left-0 z-20 transition-transform duration-75 ease-out"
                    style={{
                        transform: `translate(${cursor.x * stageScale + stagePos.x}px, ${cursor.y * stageScale + stagePos.y}px)`
                    }}
                >
                    <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md" style={{ transform: 'translate(0px, 0px)' }}>
                        <path d="M5.65376 34.0041L0.216309 0.70752L30.7107 19.3496L16.2081 21.6888L23.238 32.7317L18.1578 35.9577L11.1279 24.9148L5.65376 34.0041Z" fill={cursor.color || "#14b8a6"} stroke="white" strokeWidth="2" />
                    </svg>
                    {cursor.name && (
                        <div className="absolute left-6 top-6 bg-white shadow-md text-xs font-semibold px-2 py-1 rounded-md text-gray-700 whitespace-nowrap animate-fade-in pointer-events-none">
                            {cursor.name}
                        </div>
                    )}
                </div>
            ))}

            {/* In-Place Text Editor */}
            {textInput && (
                <div
                    className="absolute inset-0 z-30"
                    onMouseDown={(e) => {
                        if (e.target.id !== 'text-editor-input') {
                            handleTextSubmit();
                        }
                    }}
                >
                    <textarea
                        id="text-editor-input"
                        autoFocus
                        className="absolute bg-transparent text-editor outline-none border-none p-0 overflow-hidden leading-tight bg-white ring-2 ring-primary-500 rounded-sm shadow-sm"
                        style={{
                            left: `${textInput.x * stageScale + stagePos.x}px`,
                            top: `${textInput.y * stageScale + stagePos.y}px`,
                            color: textInput.color,
                            fontSize: `${textInput.brushSize * stageScale}px`,
                            minWidth: '50px',
                            minHeight: `${textInput.brushSize * stageScale + 10}px`,
                            whiteSpace: 'pre'
                        }}
                        value={textInput.val}
                        onChange={(e) => setTextInput({ ...textInput, val: e.target.value })}
                        onKeyDown={(e) => {
                            // Map Shift+Enter to newline, Enter to submit
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleTextSubmit();
                            } else if (e.key === 'Escape') {
                                setTextInput(null);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default Canvas;
