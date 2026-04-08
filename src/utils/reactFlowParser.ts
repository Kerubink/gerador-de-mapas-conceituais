import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { IMapaConceitual } from '../services/gemini';

const strToId = (str: string) => Array.from(str).map(c => c.charCodeAt(0).toString(16)).join('');
export const sanitizeId = (name: string) => {
    const letters = name.replace(/[^a-zA-Z0-9]/g, '');
    return 'node_' + (letters || strToId(name));
};

export function parseMapToFlow(map: IMapaConceitual) {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const clinicId = "Clinico";

    // Theme Central
    nodes.push({
        id: clinicId,
        data: { label: map.temaCentral },
        position: { x: 0, y: 0 },
        style: {
            background: '#f97316',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontWeight: 'bold',
            fontSize: '16px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            textAlign: 'center'
        }
    });

    map.materias.forEach(materia => {
        const matId = sanitizeId(materia.nome);
        nodes.push({
            id: matId,
            data: { label: materia.nome },
            position: { x: 0, y: 0 },
            style: {
                background: materia.cor,
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '6px',
                fontWeight: 'bold',
                padding: '10px 15px',
                textAlign: 'center'
            }
        });

        edges.push({
            id: `e_${clinicId}_${matId}`,
            source: clinicId,
            target: matId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
        });

        const matNodesList = new Set<string>();
        const hasIncoming = new Set<string>();

        materia.relacoes.forEach((rel, i) => {
            const origId = rel.origem === materia.nome ? matId : sanitizeId(rel.origem);
            const destId = rel.destino === materia.nome ? matId : sanitizeId(rel.destino);

            if (origId !== matId) matNodesList.add(origId);
            if (destId !== matId) matNodesList.add(destId);

            // Track incoming edges inside this materia to detect roots
            if (destId !== matId) hasIncoming.add(destId);

            if (!nodes.find(n => n.id === origId)) {
                nodes.push({
                    id: origId,
                    data: { label: rel.origem },
                    position: { x: 0, y: 0 },
                    style: {
                        background: materia.cor,
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        textAlign: 'center'
                    }
                });
            }
            if (!nodes.find(n => n.id === destId)) {
                nodes.push({
                    id: destId,
                    data: { label: rel.destino },
                    position: { x: 0, y: 0 },
                    style: {
                        background: materia.cor,
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        textAlign: 'center'
                    }
                });
            }

            edges.push({
                id: `e_${matId}_${i}_${origId}_${destId}`,
                source: origId,
                target: destId,
                label: rel.conectivo,
                type: 'smoothstep',
                labelBgStyle: { fill: 'rgba(255,255,255,0.7)', padding: 4 },
                labelStyle: { fontSize: 11, fontWeight: 500, fill: '#475569' },
                style: { stroke: '#cbd5e1', strokeWidth: 1.5 }
            });
        });

        // Auto-tether orphaned concepts to the Materia node
        matNodesList.forEach(nodeId => {
            if (!hasIncoming.has(nodeId)) {
                edges.push({
                    id: `e_auto_${matId}_${nodeId}`,
                    source: matId,
                    target: nodeId,
                    type: 'smoothstep',
                    // subtle dashed line for automatic tethering
                    style: { stroke: materia.cor, strokeWidth: 1.5, strokeDasharray: '4,4', opacity: 0.6 }
                });
            }
        });
    });

    if (map.conexoesCruzadas) {
        map.conexoesCruzadas.forEach((rel, i) => {
            const origId = sanitizeId(rel.origem);
            const destId = sanitizeId(rel.destino);
            edges.push({
                id: `e_cruzada_${i}`,
                source: origId,
                target: destId,
                label: rel.conectivo,
                type: 'smoothstep',
                animated: true,
                labelBgStyle: { fill: 'rgba(255,255,255,0.7)', padding: 4 },
                labelStyle: { fontSize: 11, fontWeight: 500, fill: '#f43f5e' },
                style: { stroke: '#f43f5e', strokeWidth: 1.5, strokeDasharray: '5,5' }
            });
        });
    }

    // Use Dagre for Layout
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // LR (Left to Right) layout is best for radial illusion
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 200 });

    nodes.forEach((node) => {
        // Estimating node dimensions based on average text width
        dagreGraph.setNode(node.id, { width: 150, height: 40 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = {
            x: nodeWithPosition.x - 75,
            y: nodeWithPosition.y - 20,
        };
    });

    return { initialNodes: nodes, initialEdges: edges };
}
