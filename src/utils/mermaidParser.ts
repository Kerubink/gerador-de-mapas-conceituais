import type { IMapaConceitual } from '../services/gemini';

const strToId = (str: string) => Array.from(str).map(c => c.charCodeAt(0).toString(16)).join('');
const sanitizeId = (name: string) => {
    const letters = name.replace(/[^a-zA-Z0-9]/g, '');
    return 'node_' + (letters || strToId(name));
};
const sanitizeLabel = (text: string) => text.replace(/"/g, "'").replace(/\n/g, "<br/>").replace(/\r/g, "");

export function parseConceptMapToMermaid(map: IMapaConceitual): string {
    let mermaidStr = `%%{init: {'themeVariables': { 'edgeLabelBackground':'transparent' }}}%%\ngraph LR\n`;

    const clinicId = "Clinico";
    mermaidStr += `    ${clinicId}(("<b>${sanitizeLabel(map.temaCentral)}</b>")):::clinicoStyle\n\n`;

    const half = Math.ceil(map.materias.length / 2);
    const leftMaterias = map.materias.slice(0, half);
    const rightMaterias = map.materias.slice(half);

    let styles = "\n    classDef clinicoStyle fill:#f96,stroke:#333,stroke-width:4px,color:#fff;\n";

    leftMaterias.forEach((materia) => {
        const matId = sanitizeId(materia.nome) + 'Left';
        styles += `    classDef ${matId}Style fill:${materia.cor},stroke:#333,stroke-width:2px;\n`;

        // Nodes from Left point TO clinic to give a radial illusion
        mermaidStr += `    ${matId}["${sanitizeLabel(materia.nome)}"]:::${matId}Style -.-> ${clinicId}\n`;

        materia.relacoes.forEach(rel => {
            const origId = rel.origem === materia.nome ? matId : sanitizeId(rel.origem);
            const destId = rel.destino === materia.nome ? matId : sanitizeId(rel.destino);
            if (origId !== matId) mermaidStr += `    ${origId}["${sanitizeLabel(rel.origem)}"]:::${matId}Style\n`;
            if (destId !== matId) mermaidStr += `    ${destId}["${sanitizeLabel(rel.destino)}"]:::${matId}Style\n`;
            mermaidStr += `    ${origId} -- "${sanitizeLabel(rel.conectivo)}" --> ${destId}\n`;
        });
    });

    rightMaterias.forEach((materia) => {
        const matId = sanitizeId(materia.nome) + 'Right';
        styles += `    classDef ${matId}Style fill:${materia.cor},stroke:#333,stroke-width:2px;\n`;

        // Clinic points TO right nodes
        mermaidStr += `    ${clinicId} -.-> ${matId}["${sanitizeLabel(materia.nome)}"]:::${matId}Style\n`;

        materia.relacoes.forEach(rel => {
            const origId = rel.origem === materia.nome ? matId : sanitizeId(rel.origem);
            const destId = rel.destino === materia.nome ? matId : sanitizeId(rel.destino);
            if (origId !== matId) mermaidStr += `    ${origId}["${sanitizeLabel(rel.origem)}"]:::${matId}Style\n`;
            if (destId !== matId) mermaidStr += `    ${destId}["${sanitizeLabel(rel.destino)}"]:::${matId}Style\n`;
            mermaidStr += `    ${origId} -- "${sanitizeLabel(rel.conectivo)}" --> ${destId}\n`;
        });
    });

    if (map.conexoesCruzadas && map.conexoesCruzadas.length > 0) {
        mermaidStr += `\n    %% Conexoes Cruzadas\n`;
        map.conexoesCruzadas.forEach(rel => {
            // Changed to solid line to prevent dot-line syntax issues
            mermaidStr += `    ${sanitizeId(rel.origem)} -- "${sanitizeLabel(rel.conectivo)}" --> ${sanitizeId(rel.destino)}\n`;
        });
    }

    return mermaidStr + styles;
}
