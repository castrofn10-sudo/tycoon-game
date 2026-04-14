export type DocPhrase = {
  text: string;
  category: "nonsense" | "zen" | "advice" | "market" | "signature";
};

export const DOC_PHRASES: DocPhrase[] = [
  // ── Nonsense ──────────────────────────────────────────────────────────────
  { category: "nonsense", text: "Mantenha os pés no chão. O resto é problema da cabeça." },
  { category: "nonsense", text: "Tentei fazer café com sprites. Não funcionou. Tentei de novo. Ainda não." },
  { category: "nonsense", text: "O pixel que cai não faz barulho. O orçamento cai diferente." },
  { category: "nonsense", text: "Você já pensou que os gráficos podem ser os reais e a vida o 8-bit?" },
  { category: "nonsense", text: "Li um manual de instruções uma vez. Nunca mais entrei em pânico." },
  { category: "nonsense", text: "Os dados não mentem. Os algoritmos às vezes inventam." },
  { category: "nonsense", text: "Tem um bug atrás da geladeira. Faz 3 anos. A gente se respeita." },
  { category: "nonsense", text: "Às 4 da manhã tudo faz sentido. Às 10 da manhã não faz. Durma às 4." },
  { category: "nonsense", text: "Fui ao banco pedir empréstimo. Pediram um PowerPoint. Mandei um 404." },
  { category: "nonsense", text: "O mercado aquece. Eu também. Temos isso em comum." },
  { category: "nonsense", text: "Existe uma teoria que diz que todo MVP falha primeiro. Chama-se 'minha vida'." },
  { category: "nonsense", text: "Se você ler os termos de uso até o fim, encontra um cupom. Mentira. Mas... e se não fosse?" },
  { category: "nonsense", text: "Já ouvi dizer que o limite é o céu. O CEO da empresa aí em cima discorda." },
  { category: "nonsense", text: "Uma empresa sem nome é uma startup. Uma startup sem dinheiro é um hobby caro." },
  { category: "nonsense", text: "Processador de alta geração? Ou minha cabeça numa segunda-feira? Indistinguível." },
  { category: "nonsense", text: "Vi um concorrente lançar um produto ontem. Hoje parece que sempre existiu. Estranha, essa memória." },
  { category: "nonsense", text: "O suporte técnico disse pra reiniciar. Reiniciei a empresa inteira. Não era isso." },
  { category: "nonsense", text: "Existem 2 tipos de relatório: o que ninguém lê e o que ninguém entende." },
  { category: "nonsense", text: "Meu psicólogo disse que sou 'criativo'. Acho que quis dizer 'confuso'. Aceitei os dois." },
  { category: "nonsense", text: "Planejamento estratégico: escrever com confiança coisas que vão mudar amanhã." },

  // ── Zen / Filosófico ──────────────────────────────────────────────────────
  { category: "zen", text: "A empresa cresce como bambu: invisível por anos... depois CRACK." },
  { category: "zen", text: "Cada decisão é uma porta. Você esqueceu a chave, mas a porta estava aberta." },
  { category: "zen", text: "O fracasso é só sucesso que ainda não tomou café." },
  { category: "zen", text: "Nem todo pixel brilhante é tesouro. Mas todo tesouro brilha." },
  { category: "zen", text: "O tempo no jogo avança. O tempo na vida também. Coincidência?" },
  { category: "zen", text: "O silêncio entre lançamentos é o que cria o hype." },
  { category: "zen", text: "Quem domina o local, domina o global. Ou perde tudo. Uma das duas." },
  { category: "zen", text: "Você é o arquiteto e também a cidade. Confuso? Bom sinal." },
  { category: "zen", text: "Nem toda crise é derrota. Algumas são só... turbulência com marketing ruim." },
  { category: "zen", text: "O mercado não tem memória. Os seus erros ficam." },
  { category: "zen", text: "Às vezes o melhor movimento é não fazer nada. Às vezes não. Boa sorte decidindo." },

  // ── Conselho Disfarçado ───────────────────────────────────────────────────
  { category: "advice", text: "Funcionários felizes fazem produtos melhores. Ou foi o café? Provavelmente os dois." },
  { category: "advice", text: "Pesquisa hoje, lucro amanhã. Ou nunca. Mas provavelmente amanhã." },
  { category: "advice", text: "Se você não lançou nada, o mercado vai fingir que você não existe." },
  { category: "advice", text: "Reputação: anos pra construir, semanas pra destruir. Trate ela bem." },
  { category: "advice", text: "Console novo sem marketing é gritar numa câmara de eco vazia." },
  { category: "advice", text: "Diversifique os países antes que um te arruíne completamente." },
  { category: "advice", text: "Dívida que você não vê ainda aparece no balanço. Sempre." },
  { category: "advice", text: "Três produtos mediocres valem menos que um produto lendário. Vai fundo." },
  { category: "advice", text: "Bug no jogo: ruim. Bug no financeiro: catastrófico. Priorize o que dói mais." },
  { category: "advice", text: "Expansão prematura matou empresas maiores que a sua. Cresce com fundação." },

  // ── Mercado / Negócios ────────────────────────────────────────────────────
  { category: "market", text: "Os rivais também estão acordados às 3 da manhã. Olhando seus números." },
  { category: "market", text: "Mercado saturado é pizza sem queijo. Tecnicamente pizza. Mas triste." },
  { category: "market", text: "Expansão sem capital é esperança com CNPJ." },
  { category: "market", text: "Já vi empresas maiores afundarem em dívidas menores. Tamanho não protege." },
  { category: "market", text: "O mercado japonês é como origami: parece simples, leva anos pra dominar." },
  { category: "market", text: "Ações sobem. Ações caem. O CEO que vende no pico tem casa na praia." },
  { category: "market", text: "Uma empresa sem rivais é um jogo sem chefe final. Chato. E suspeito." },
  { category: "market", text: "Influenciador ruim é dinheiro jogado fora. Influenciador certo é viral orgânico." },
  { category: "market", text: "Licença de tecnologia exclusiva: o poder que poucos entendem e menos ainda usam." },

  // ── Assinatura ────────────────────────────────────────────────────────────
  { category: "signature", text: "Preciso de um tchozenn..." },
  { category: "signature", text: "Mano… isso aqui tá estranho… preciso de um tchozenn…" },
  { category: "signature", text: "Nada faz sentido… preciso de um tchozenn…" },
  { category: "signature", text: "Calma… deixa fluir… preciso de um tchozenn…" },
  { category: "signature", text: "Três reuniões, dois bugs, uma crise… preciso de um tchozenn." },
  { category: "signature", text: "Às vezes olho pro relatório e penso… preciso de um tchozenn." },
  { category: "signature", text: "A inflação subiu, o mercado caiu… preciso de um tchozenn." },

  // ── Tchozenn – 5 Estrelas / Sucesso ───────────────────────────────────────
  { category: "signature", text: "Cara… isso foi tão bom que vou pegar meu Tchozenn." },
  { category: "signature", text: "Calma… isso aqui merece um Tchozenn de respeito." },
  { category: "signature", text: "Isso aqui não é jogo… isso aqui é momento Tchozenn." },
  { category: "signature", text: "Perfeito. Simplesmente perfeito. Cadê meu Tchozenn?" },
  { category: "signature", text: "Depois dessa eu vou até sentar… e pegar meu Tchozenn." },

  // ── Tchozenn – Sucesso Gigante ─────────────────────────────────────────────
  { category: "signature", text: "Você acabou de zerar o mercado… eu vou ali de Tchozenn e já volto." },
  { category: "signature", text: "Isso aqui foi nível 'acende o Tchozenn e observa'." },
  { category: "signature", text: "Não faz nada… só aprecia… e pega o Tchozenn." },
  { category: "signature", text: "Isso aqui merece silêncio… e um Tchozenn bem pensado." },
  { category: "signature", text: "Eu não tenho palavras… só Tchozenn." },

  // ── Tchozenn – Caos / Confusão ─────────────────────────────────────────────
  { category: "signature", text: "Eu não entendi nada… mas funcionou… Tchozenn resolve." },
  { category: "signature", text: "Isso aqui faz sentido… depois de um Tchozenn talvez." },
  { category: "signature", text: "Calma… deixa eu raciocinar… vou ali no Tchozenn." },
  { category: "signature", text: "Você planejou isso ou foi no feeling do Tchozenn?" },
  { category: "signature", text: "Isso aqui tá estranho… mas eu gostei… estilo Tchozenn." },

  // ── Tchozenn – Fracasso ────────────────────────────────────────────────────
  { category: "signature", text: "Olha… acho que nem o Tchozenn salva isso aqui." },
  { category: "signature", text: "Isso aqui deu ruim… vou ali pensar no Tchozenn." },
  { category: "signature", text: "Talvez com um Tchozenn isso faça sentido… talvez." },
  { category: "signature", text: "Isso aqui foi ousado… ousado até demais… cadê o Tchozenn." },
  { category: "signature", text: "Eu vou fingir que entendi… e pegar o Tchozenn." },

  // ── Tchozenn – Humor Aleatório ─────────────────────────────────────────────
  { category: "signature", text: "Não mexe mais nisso… tá perfeito… pega o Tchozenn." },
  { category: "signature", text: "Se melhorar estraga… acende o Tchozenn e deixa assim." },
  { category: "signature", text: "Isso aqui foi tão bom que eu esqueci o que ia falar… Tchozenn." },
  { category: "signature", text: "Você não fez um jogo… você fez um clima… Tchozenn aprovado." },
  { category: "signature", text: "Isso aqui tá com uma energia… diferente… Tchozenn vibes." },

  // ── Tchozenn – Dominação sobre Rivais ─────────────────────────────────────
  { category: "signature", text: "A concorrência caiu… eu vou ali comemorar de Tchozenn." },
  { category: "signature", text: "Isso aqui foi massacre… nível Tchozenn e risada." },
  { category: "signature", text: "Eles tentaram… você fez história… Tchozenn liberado." },
  { category: "signature", text: "Isso aqui foi covardia… pega o Tchozenn e observa." },
  { category: "signature", text: "Os caras ainda tão carregando o jogo… você já tá no Tchozenn." },
];

export type DocWeights = { nonsense: number; zen: number; advice: number; market: number; signature: number };

const WEIGHTS: DocWeights = { nonsense: 35, zen: 18, advice: 18, market: 13, signature: 16 };

function pickCategory(): DocPhrase["category"] {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [cat, w] of Object.entries(WEIGHTS) as [DocPhrase["category"], number][]) {
    r -= w;
    if (r <= 0) return cat;
  }
  return "nonsense";
}

export function pickDocPhrase(
  recentIndices: number[],
  categoryHint?: DocPhrase["category"]
): { text: string; index: number } {
  const category = categoryHint ?? pickCategory();
  const pool = DOC_PHRASES.map((p, i) => ({ ...p, i })).filter(
    (p) => p.category === category && !recentIndices.includes(p.i)
  );
  const fallback = DOC_PHRASES.map((p, i) => ({ ...p, i })).filter(
    (p) => !recentIndices.includes(p.i)
  );
  const candidates = pool.length > 0 ? pool : fallback.length > 0 ? fallback : DOC_PHRASES.map((p, i) => ({ ...p, i }));
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return { text: chosen.text, index: chosen.i };
}

export const DOC_MIN_COOLDOWN = 4;           // minimum months between random appearances
export const DOC_MAX_COOLDOWN = 8;           // maximum months between random appearances
export const DOC_APPEAR_CHANCE = 0.20;       // 20% chance per month once cooldown expires
export const DOC_CONTEXTUAL_CHANCE = 0.60;   // 60% chance when a contextual trigger fires
export const DOC_CONTEXTUAL_MIN_COOLDOWN = 2; // contextual triggers bypass cooldown if ≤ 2 months left
export const DOC_RECENT_MEMORY = 6;
