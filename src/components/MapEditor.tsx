import React, { useState } from 'react';
import type { IMapaConceitual, IMateria, IRelacao } from '../services/gemini';
import { Plus, Trash2, ChevronDown, ChevronRight, Edit3 } from 'lucide-react';

interface MapEditorProps {
    map: IMapaConceitual;
    onChange: (newMap: IMapaConceitual) => void;
}

export const MapEditor: React.FC<MapEditorProps> = ({ map, onChange }) => {
    const [expandedMateria, setExpandedMateria] = useState<number | null>(null);

    // Mapeamento Global para Autocompletar (Linkagem de Conceitos)
    const allConcepts = new Set<string>();
    if (map.temaCentral) allConcepts.add(map.temaCentral);
    map.materias.forEach(m => {
        if (m.nome) allConcepts.add(m.nome);
        m.relacoes.forEach(r => {
            if (r.origem) allConcepts.add(r.origem);
            if (r.destino) allConcepts.add(r.destino);
        });
    });
    const conceptArray = Array.from(allConcepts);

    const handleUpdateTema = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...map, temaCentral: e.target.value });
    };

    const addMateria = () => {
        const newMateria: IMateria = {
            nome: 'Nova Matéria',
            cor: '#e2e8f0', // slate-200
            conceitos: [],
            relacoes: []
        };
        onChange({ ...map, materias: [...map.materias, newMateria] });
    };

    const updateMateria = (index: number, key: keyof IMateria, value: any) => {
        const newMaterias = [...map.materias];
        newMaterias[index] = { ...newMaterias[index], [key]: value };
        onChange({ ...map, materias: newMaterias });
    };

    const removeMateria = (index: number) => {
        const newMaterias = map.materias.filter((_, i) => i !== index);
        onChange({ ...map, materias: newMaterias });
    };

    // Funções de Conexões Cruzadas
    const addCruzada = () => {
        const nova: IRelacao = { origem: '', destino: '', conectivo: '' };
        onChange({ ...map, conexoesCruzadas: [...(map.conexoesCruzadas || []), nova] });
    };

    const updateCruzada = (index: number, key: keyof IRelacao, value: string) => {
        if (!map.conexoesCruzadas) return;
        const array = [...map.conexoesCruzadas];
        array[index] = { ...array[index], [key]: value };
        onChange({ ...map, conexoesCruzadas: array });
    };

    const removeCruzada = (index: number) => {
        if (!map.conexoesCruzadas) return;
        onChange({ ...map, conexoesCruzadas: map.conexoesCruzadas.filter((_, i) => i !== index) });
    };

    return (
        <div className="flex flex-col gap-4 p-4 text-slate-700 h-full overflow-y-auto">

            {/* HTML Datalist global invisivel que injeta as opções do reactFlow na UI */}
            <datalist id="all-concepts">
                {conceptArray.map((c, i) => <option key={i} value={c} />)}
            </datalist>

            {/* TEMA CENTRAL */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                    <Edit3 size={16} className="text-blue-500" />
                    Tópico / Paciente Central
                </label>
                <input
                    type="text"
                    value={map.temaCentral}
                    onChange={handleUpdateTema}
                    className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <hr className="border-slate-100" />

            {/* DISCIPLINAS */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-800">
                        Disciplinas (Sub-Mapas)
                    </label>
                    <button onClick={addMateria} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 flex items-center gap-1 transition-colors">
                        <Plus size={14} /> Nova
                    </button>
                </div>

                {map.materias.map((materia, mIdx) => {
                    const isExpanded = expandedMateria === mIdx;
                    return (
                        <div key={mIdx} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                            <div
                                className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 border-b border-slate-100 transition-colors"
                                onClick={() => setExpandedMateria(isExpanded ? null : mIdx)}
                            >
                                {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: materia.cor }} />
                                <span className="font-medium text-sm flex-1">{materia.nome}</span>
                                <button onClick={(e) => { e.stopPropagation(); removeMateria(mIdx); }} className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {isExpanded && (
                                <div className="p-3 bg-white flex flex-col gap-4 text-sm">
                                    {/* INFO BASICA DA MATERIA */}
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                                            value={materia.nome}
                                            onChange={e => updateMateria(mIdx, 'nome', e.target.value)}
                                            placeholder="Nome (Ex: Fisiologia)"
                                        />
                                        <input
                                            type="color"
                                            value={materia.cor}
                                            onChange={e => updateMateria(mIdx, 'cor', e.target.value)}
                                            className="w-8 h-8 rounded p-0 border-0 cursor-pointer"
                                        />
                                    </div>

                                    {/* RELACOES DENTRO DA MATERIA */}
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Ligações Lógicas</span>
                                            <button
                                                onClick={() => updateMateria(mIdx, 'relacoes', [...materia.relacoes, { origem: '', destino: '', conectivo: '' }])}
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-blue-50 px-2 py-0.5 rounded-md"
                                            >
                                                <Plus size={12} /> Adicionar Link
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {materia.relacoes.map((rel, rIdx) => (
                                                <div key={rIdx} className="flex flex-col gap-1.5 p-3 border border-slate-200 rounded relative bg-white shadow-sm">
                                                    <button
                                                        onClick={() => updateMateria(mIdx, 'relacoes', materia.relacoes.filter((_, i) => i !== rIdx))}
                                                        className="absolute -top-2 -right-2 bg-white text-red-600 border border-slate-200 rounded-full p-1 hover:bg-red-50 shadow-sm"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                    <div className="flex gap-2">
                                                        <input list="all-concepts" placeholder="Origem da setinha" className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 outline-none" value={rel.origem} onChange={e => {
                                                            const nr = [...materia.relacoes];
                                                            nr[rIdx] = { ...nr[rIdx], origem: e.target.value };
                                                            updateMateria(mIdx, 'relacoes', nr);
                                                        }} />
                                                    </div>
                                                    <div className="flex items-center gap-2 pl-4">
                                                        <span className="text-slate-300">↳</span>
                                                        <input placeholder="Conectivo (O que a seta faz? Ex: causa)" className="flex-1 border border-blue-200 rounded px-2 py-1 text-xs text-blue-600 focus:ring-1 focus:ring-blue-400 outline-none bg-blue-50/50" value={rel.conectivo} onChange={e => {
                                                            const nr = [...materia.relacoes];
                                                            nr[rIdx] = { ...nr[rIdx], conectivo: e.target.value };
                                                            updateMateria(mIdx, 'relacoes', nr);
                                                        }} />
                                                    </div>
                                                    <div className="flex gap-2 pl-8">
                                                        <span className="text-slate-300">↳</span>
                                                        <input list="all-concepts" placeholder="Destino da setinha" className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 outline-none" value={rel.destino} onChange={e => {
                                                            const nr = [...materia.relacoes];
                                                            nr[rIdx] = { ...nr[rIdx], destino: e.target.value };
                                                            updateMateria(mIdx, 'relacoes', nr);
                                                        }} />
                                                    </div>
                                                </div>
                                            ))}
                                            {materia.relacoes.length === 0 && <span className="text-xs text-slate-400 italic">Sem conexões.</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <hr className="border-slate-100" />

            {/* CONEXOES CRUZADAS */}
            <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-800">
                        Conexões Livres (Em Todo o Mapa)
                    </label>
                    <button onClick={addCruzada} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 flex items-center gap-1 transition-colors">
                        <Plus size={14} /> Novo Link Livre
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    {(map.conexoesCruzadas || []).map((rel, cIdx) => (
                        <div key={cIdx} className="flex flex-wrap items-center gap-1.5 p-3 border border-slate-200 border-dashed rounded-lg bg-slate-50 relative">
                            <button onClick={() => removeCruzada(cIdx)} className="absolute -top-2 -right-2 text-red-500 p-1 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-red-50"><Trash2 size={12} /></button>
                            <input list="all-concepts" placeholder="Origem" className="flex-1 min-w-[30%] border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-400" value={rel.origem} onChange={e => updateCruzada(cIdx, 'origem', e.target.value)} />
                            <input placeholder="Conectivo" className="w-[80px] border border-blue-200 bg-blue-50 rounded px-1.5 py-1.5 text-xs text-blue-700 outline-none text-center" value={rel.conectivo} onChange={e => updateCruzada(cIdx, 'conectivo', e.target.value)} />
                            <input list="all-concepts" placeholder="Destino" className="flex-1 min-w-[30%] border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-400" value={rel.destino} onChange={e => updateCruzada(cIdx, 'destino', e.target.value)} />
                        </div>
                    ))}
                    {(!map.conexoesCruzadas || map.conexoesCruzadas.length === 0) && <span className="text-xs text-slate-400 italic">Crie uma seta pontilhada transversal vermelha de qualquer caixa gerada para outra caixa distante.</span>}
                </div>
            </div>

        </div>
    );
};
