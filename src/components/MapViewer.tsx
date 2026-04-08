import React, { useEffect, useRef } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, BackgroundVariant, Panel, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { IMapaConceitual } from '../services/gemini';
import { parseMapToFlow } from '../utils/reactFlowParser';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

interface MapViewerProps {
    mapData: IMapaConceitual | null;
}

export const MapViewer: React.FC<MapViewerProps> = ({ mapData }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mapData) {
            const { initialNodes, initialEdges } = parseMapToFlow(mapData);
            setNodes(initialNodes);
            setEdges(initialEdges);
        }
    }, [mapData, setNodes, setEdges]);

    const handleDownloadPdf = async () => {
        const viewportNode = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportNode || nodes.length === 0) return;

        try {
            // Get exact dimensions of all nodes together
            const bounds = getNodesBounds(nodes);

            // Add padding so it doesn't touch the borders
            const imageWidth = bounds.width + 150;
            const imageHeight = bounds.height + 150;

            // Calculate a viewport transformation that un-zooms and aligns the whole graph
            const viewport = getViewportForBounds(
                bounds,
                imageWidth,
                imageHeight,
                0.1,
                2,
                0.1
            );

            // Capture the specific viewport with modified size and position
            const dataUrl = await toPng(viewportNode, {
                backgroundColor: '#f8fafc',
                width: imageWidth,
                height: imageHeight,
                style: {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
                }
            });

            // Put it into a dynamic PDF
            const pdf = new jsPDF({
                orientation: imageWidth > imageHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [imageWidth, imageHeight]
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, imageWidth, imageHeight);
            pdf.save(`medmap-${mapData?.temaCentral.replace(/[^a-zA-Z0-9]/g, '') || 'export'}.pdf`);
        } catch (err) {
            console.error('Error generating PDF', err);
        }
    };

    if (!mapData) return null;

    return (
        <div ref={reactFlowWrapper} className="w-full h-full min-h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
                className="bg-slate-50"
            >
                <Panel position="top-right">
                    <button
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium"
                    >
                        <Download size={16} /> Exportar PDF
                    </button>
                </Panel>
                <MiniMap nodeStrokeWidth={3} nodeColor={(n) => n.style?.background as string || '#eee'} />
                <Controls />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>
        </div>
    );
};
