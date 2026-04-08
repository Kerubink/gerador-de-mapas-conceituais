import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Inicializa a SDK. Se apiKey estiver vazio em dev, o usuário ainda precisará configurar o auth
const ai = new GoogleGenAI({ apiKey: apiKey || 'API_KEY_NAO_CONFIGURADA' });

const systemInstruction = `
Você é um especialista em tutoria médica e criação de mapas conceituais baseados em Mermaid.js.
O usuário fornecerá um caso clínico ou relatório denso.
Sua tarefa é extrair os conceitos principais, conectá-los com frases lógicas, e separá-los por disciplinas médicas.
Retorne o resultado puramente no formato JSON estruturado, conforme especificado abaixo.

Estrutura esperada do JSON:
{
  "temaCentral": "Nome curto do Caso Clínico Motriz",
  "materias": [
    {
      "nome": "Nome da Matéria (ex: Anatomia)",
      "cor": "#CorHexadecimal (ex: Anatomia #bfb, Bioquímica #bbf, Embriologia #fbb)",
      "conceitos": ["Conceito 1", "Conceito 2", "Conceito 3"],
      "relacoes": [
        {"origem": "Nome da Matéria", "destino": "Conceito 1", "conectivo": "estuda o"},
        {"origem": "Conceito 1", "destino": "Conceito 2", "conectivo": "causa"}
      ]
    }
  ],
  "conexoesCruzadas": [
    {"origem": "Conceito X (de uma matéria)", "destino": "Conceito Y (de outra matéria)", "conectivo": "impacta sobre"}
  ]
}

Regras:
1. Retorne APENAS o JSON válido, sem tags markdown ou comentários adicionais.
2. Seja conciso nos nomes dos conceitos para facilitar a leitura no mapa.
3. Crie relatórios ricos. Uma matéria pode ter muitos conceitos se necessário.
`;

export interface IRelacao {
    origem: string;
    destino: string;
    conectivo: string;
}

export interface IMateria {
    nome: string;
    cor: string;
    conceitos: string[];
    relacoes: IRelacao[];
}

export interface IMapaConceitual {
    temaCentral: string;
    materias: IMateria[];
    conexoesCruzadas: IRelacao[];
}

export async function generateConceptMapStructure(text: string): Promise<IMapaConceitual> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: text,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as IMapaConceitual;
        }
        throw new Error('Retorno vazio da IA');
    } catch (error) {
        console.error('Erro ao gerar mapa conceitual:', error);
        throw error;
    }
}
