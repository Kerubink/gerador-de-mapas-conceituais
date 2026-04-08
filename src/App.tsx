import { useState } from 'react'
import { BookOpen, Map, Loader2, Sparkles, FileText, AlertCircle, Edit2 } from 'lucide-react'
import { generateConceptMapStructure, type IMapaConceitual } from './services/gemini'
import { MapViewer } from './components/MapViewer'
import { MapEditor } from './components/MapEditor'

function App() {
  const [reportText, setReportText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conceptMap, setConceptMap] = useState<IMapaConceitual | null>(null)
  const [activeTab, setActiveTab] = useState<'master' | 'disciplina'>('master')
  const [activeDisciplina, setActiveDisciplina] = useState<string>('')
  const [inputMode, setInputMode] = useState<'text' | 'editor'>('text')

  const handleGenerate = async () => {
    if (!reportText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateConceptMapStructure(reportText);
      setConceptMap(result);
      setActiveTab('master');
      setInputMode('editor');
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com a IA. Configure a chave da API no arquivo .env");
    } finally {
      setLoading(false);
    }
  }

  const getActiveMapData = (): IMapaConceitual | null => {
    if (!conceptMap) return null;
    if (activeTab === 'master') {
      return conceptMap;
    } else {
      const materia = conceptMap.materias.find(m => m.nome === activeDisciplina);
      if (!materia) return null;
      const filteredMap: IMapaConceitual = {
        temaCentral: conceptMap.temaCentral,
        materias: [materia],
        conexoesCruzadas: conceptMap.conexoesCruzadas?.filter(
          c => c.origem === materia.nome || c.destino === materia.nome ||
            materia.conceitos.includes(c.origem) || materia.conceitos.includes(c.destino)
        ) || []
      };
      return filteredMap;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full bg-white border-b border-slate-200 py-4 px-6 sm:px-10 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight m-0">MedMap Builder</h1>
            <p className="text-sm text-slate-500 m-0">Gerador Visual de Mapas Conceituais (Gemini 2.5)</p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 flex-1">
        <aside className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:h-[calc(100vh-140px)] sticky top-[90px]">
            {/* Abas Superiores do Painel Esquerdo */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${inputMode === 'text' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <FileText size={16} /> IA Generativa
              </button>
              <button
                onClick={() => setInputMode('editor')}
                disabled={!conceptMap}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${!conceptMap ? 'opacity-50 cursor-not-allowed text-slate-400' : inputMode === 'editor' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Edit2 size={16} /> Edição Fina
              </button>
            </div>

            {/* Renderização Condicional da Lateral */}
            {inputMode === 'text' ? (
              <>
                <div className="p-4 flex-1 flex flex-col min-h-[300px]">
                  <textarea
                    className="flex-1 w-full resize-none border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="Cole aqui o relatório da tutoria, as pesquisas e o caso clínico..."
                    value={reportText}
                    onChange={e => setReportText(e.target.value)}
                  />
                  {error && (
                    <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2 items-start border border-red-100">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !reportText.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Gerando Mapa Lógico...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Mapear Novo Texto
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-hidden relative">
                {conceptMap && <MapEditor map={conceptMap} onChange={setConceptMap} />}
              </div>
            )}
          </div>
        </aside>

        <section className="flex flex-col gap-4 h-full min-h-[600px]">
          {!conceptMap && !loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-dashed h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <Map size={48} className="text-slate-300" />
              </div>
              <h2 className="text-xl font-medium text-slate-600 mb-2">Nenhum mapa gerado</h2>
              <p className="max-w-md mb-6">Cole o seu relatório médico na aba 'IA Generativa' e clique para organizar as matérias e ramificações. Depois use 'Edição Fina' para os ajustes finos.</p>

              <div className="flex items-center w-full max-w-xs gap-4 mb-6">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">ou</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <button
                onClick={() => {
                  setConceptMap({ temaCentral: "Novo Tópico / Título", materias: [], conexoesCruzadas: [] });
                  setActiveTab('master');
                  setInputMode('editor');
                }}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors flex items-center gap-2 shadow-sm border border-slate-200 hover:border-slate-300"
              >
                <Edit2 size={18} className="text-blue-500" />
                Criar Mapa do Zero (Manual)
              </button>
            </div>
          ) : loading && !conceptMap ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center text-slate-500">
              <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
              <p className="font-medium animate-pulse text-lg">Processando IA...</p>
              <p className="text-sm mt-2 text-slate-400">Classificando termos, traçando ligações e distribuindo em abas.</p>
            </div>
          ) : conceptMap ? (
            <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-3 pt-4 px-4 flex flex-wrap gap-2 overflow-x-auto min-h-[68px]">
                <button
                  onClick={() => setActiveTab('master')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'master' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Mapa Principal (Tudo)
                </button>
                <div className="w-px h-8 bg-slate-300 mx-1 self-center" />
                {conceptMap.materias.map(m => (
                  <button
                    key={m.nome}
                    onClick={() => { setActiveTab('disciplina'); setActiveDisciplina(m.nome); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'disciplina' && activeDisciplina === m.nome ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-800/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded block" style={{ backgroundColor: m.cor }}></span>
                    {m.nome}
                  </button>
                ))}
              </div>
              <div className="flex-1 rounded-b-2xl overflow-hidden relative">
                <MapViewer mapData={getActiveMapData()} />
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}

export default App
