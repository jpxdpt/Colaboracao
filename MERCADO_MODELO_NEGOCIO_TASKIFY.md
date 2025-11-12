# Taskify - Pesquisa de Mercado, Visão do Produto e Modelo de Negócio

## 1. Visão Geral do Projeto

A Taskify é uma plataforma integrada de gestão de trabalho, gamification e inteligência artificial desenhada para equipas modernas.

Não é apenas um gestor de tarefas, nem apenas um sistema de pontos: é uma camada de foco, motivação e decisão inteligente por cima das ferramentas e processos que as empresas já utilizam.

Pilares principais do projeto:

- Organização do trabalho
  - Gestão de tarefas, metas e objetivos por utilizador, equipa e organização.
  - Vistas avançadas (Kanban, Gantt, dashboards) pensadas para equipas operacionais, comerciais, suporte e projetos.

- Gamificatio séria
  - Pontos, níveis, badges, rankings, desafios e recompensas alinhados a KPIs reais.
  - Mecanismos configuráveis por cliente para incentivar comportamentos desejados (ex.: contactos realizados, tickets resolvidos, formação concluída, qualidade de serviço).

- IA aplicada ao negócio
  - Recomendações: o que cada utilizador/equipa deve priorizar hoje para maximizar resultados.
  - Analytics preditivo: risco de não cumprir objetivos, sinais de quebra de engagement, alerta de equipas em risco.
  - Assistente conversacional interno: explica regras, interpreta dashboards, sugere ações e responde a dúvidas sobre campanhas, objetivos e métricas.

- Arquitetura híbrida e enterprise-ready
  - Suporte a modelos de IA locais (self-hosted) e cloud, com política "local-first" e fallback controlado.
  - Controlo sobre dados, logs, métricas e privacidade, preparado para ambientes regulados.
  - Design modular: backend Node/TypeScript, frontend React moderno, pacote shared partilhado entre serviços.

Objetivo estratégico:

Ajudar empresas a transformar trabalho diário em resultados mensuráveis, mantendo equipas motivadas, alinhadas e com suporte inteligente para a tomada de decisão.

## 2. Análise de Mercado

### 2.1 Contexto

Tendências principais:

- Digitalização dos processos internos e foco em eficiência operacional.
- "Fadiga de ferramentas": as empresas já usam várias plataformas (Jira, CRM, Teams, etc.); a oportunidade está em integrar e gerar engagement e foco, não criar mais fragmentação.
- Guerra por talento e engagement: retenção, motivação e bem-estar são prioridades estratégicas.
- Crescimento da IA aplicada: procura por recomendações, previsões e assistentes internos, com forte preocupação com privacidade (GDPR/LGPD) e soberania de dados.

### 2.2 Concorrência e Referências

Categorias relevantes:

- Gestão de tarefas/projetos: Asana, Trello, Monday.com, ClickUp.
- Gamificação corporativa: Bunchball, Centrical, soluções custom internas.
- Performance/OKRs: Lattice, Leapsome, Gtmhub, Perdoo.
- IA horizontal: copilots genéricos integrados em suites (Microsoft, Google, etc.).

Gap identificado:

Poucos produtos combinam, de forma integrada:

- foco operacional diário (tarefas e objetivos acionáveis),
- gamification alinhada a KPIs reais,
- IA com contexto do negócio,
- opção híbrida local+cloud para setores regulados.

É neste espaço que a Taskify se posiciona.

## 3. Proposta de Valor Taskify

### 3.1 Para a Gestão (C-level, Diretores)

- Aumento de performance: mais tarefas críticas concluídas, maior alinhamento com objetivos.
- Visibilidade em tempo real: dashboards, rankings saudáveis, alertas de desvios.
- Dados acionáveis com IA: previsões de cumprimento de metas, risco de baixa performance/engagement.
- Segurança e compliance: opção de processamento local e controlo sobre dados enviados para cloud.

### 3.2 Para Team Leaders

- Consolidação num único ambiente de:
  - acompanhamento de tarefas e objetivos,
  - lançamento de desafios,
  - reconhecimento rápido e transparente.
- Menos micro-gestão, mais gestão por indicadores e comportamentos.

### 3.3 Para Colaboradores

- Clareza: sabem o que é esperado e como o seu trabalho contribui.
- Motivação: pontos, níveis, badges, recompensas, feedback contínuo.
- Autonomia: assistente que ajuda a priorizar tarefas e compreender regras e métricas.

## 4. Funcionalidades-Chave

- Gestão de tarefas e objetivos
  - Kanban, listas, vistas por equipa.
  - Metas ligadas a indicadores concretos do negócio.

- Gamificação configurável
  - Pontos por ações relevantes (vendas, chamadas, tickets, formações, etc.).
  - Rankings por equipa, por campanha ou período.
  - Desafios temáticos e recompensas configuráveis.

- IA Híbrida aplicada ao negócio
  - Recomendações: próximas ações prioritárias, sugestões de foco diário.
  - Previsões: probabilidade de cumprir objetivos, alertas de risco.
  - Assistente conversacional: suporte interno, explicação de campanhas, KPIs e relatórios.
  - Arquitetura local-first com fallback cloud para equilíbrio entre custo, performance e privacidade.

- Integrações
  - Integração com CRM, helpdesk, ERP, HRIS e outras fontes.
  - Transformação de eventos reais em pontos, tarefas e insights automáticos.

## 5. Segmentação e Go-to-Market

### 5.1 Segmentos-Alvo Prioritários

- Contact centers e suporte ao cliente
- Equipas comerciais (B2B/B2C)
- Operações e backoffice (seguros, banca, telecom, utilities, serviços)
- Organizações com forte exigência de compliance (financeiro, saúde, setor público)

### 5.2 Perfis de Decisão

- Sponsor: Diretor de Operações, Diretor Comercial, Diretor de Atendimento, CHRO, COO.
- Influencers: líderes de equipa, responsáveis de formação, transformação digital.
- Gatekeepers: IT/Security (onde a Taskify diferencia com IA híbrida e governação de dados).

## 6. Modelo de Negócio

### 6.1 SaaS por Utilizador

Modelo base:

- Licenciamento por utilizador ativo/mês.
- Inclui:
  - Plataforma de tarefas + gamification.
  - Dashboards standard.
  - Suporte e manutenção.

### 6.2 Planos Propostos (Modelo Mensal por Escalões)

Para simplificar a decisão e garantir previsibilidade, a Taskify pode ser comercializada com valores fixos mensais por escalão de utilizadores.

Valores de referência (ajustáveis conforme setor, país e maturidade do cliente):

- Plano Growth
  - Até 50 utilizadores: 250€/mês
  - Até 100 utilizadores: 400€/mês
  - Até 250 utilizadores: 700€/mês
  - Inclui:
    - Gestão de tarefas e objetivos.
    - Gamificação base (pontos, níveis, rankings simples).
    - Dashboards standard.

- Plano Performance
  - Até 50 utilizadores: 450€/mês
  - Até 100 utilizadores: 700€/mês
  - Até 250 utilizadores: 1 100€/mês
  - Inclui:
    - Tudo do Growth.
    - IA de recomendações básicas (priorização, sugestões de foco).
    - Insights preditivos simples.
    - 1–2 integrações (ex.: CRM ou helpdesk principal).

- Plano Enterprise (IA Híbrida / Setores Regulados)
  - Até 250 utilizadores: desde 2 000€/mês
  - Mais de 250 utilizadores: proposta à medida (ex.: 3 000–6 000€/mês conforme requisitos).
  - Inclui:
    - Tudo do Performance.
    - IA avançada (assistente, previsões profundas, scoring customizado).
    - Arquitetura híbrida (on-prem/VPC), controlo rigoroso de dados.
    - Integrações avançadas, SLAs dedicados, governação e auditoria.

Notas internas (para afinar preço por cliente):

- Estes valores correspondem, em média, a uma lógica de 3€–18€ por utilizador/mês, mas apresentados em formato de pacote fixo para facilitar a venda.
- Em early-stage ou pilotos, pode ser usado um "Pacote Piloto" (ex.: 500–1 000€/mês até 100 utilizadores, por 3 meses) para acelerar decisão.

### 6.3 Add-ons (Upsell)

- Setup / Onboarding
  - 1 500€–10 000€ (consoante número de equipas, integrações e desenho de regras de gamification).

- Integrações Custom
  - 1 000€–5 000€ por integração específica não coberta nos conectores standard.

- Serviços de Consultoria e Gamificação
  - 500€–1 500€ / dia
  - Desenho de mecânicas de jogo, campanhas, comunicação interna, formação de líderes.

- IA Dedicada / Modelos Custom
  - Fee mensal adicional (ex.: 500€–2 000€ / mês) + custos de infraestrutura associados.
  - Para clientes que querem modelos treinados com dados próprios ou requisitos especiais.

### 6.4 Argumento de ROI

- Posicionar sempre o investimento face a ganhos potenciais em:
  - + Produtividade (mais tarefas críticas concluídas).
  - + Receita (mais conversões, melhor aproveitamento da força comercial).
  - - Rotatividade (retenção de talento e redução de custos de recrutamento).
- Objetivo: que o custo da Taskify represente uma fração pequena do valor adicional gerado pelas equipas.

### 6.5 Racional dos Preços

Os valores propostos são baseados em três pilares principais:

- Referência de mercado
  - Gamificação corporativa (Bunchball, Centrical, Hooptap): 5€–15€ por utilizador/mês.
  - SaaS de performance/OKR (Lattice, Leapsome, Gtmhub): 3€–10€ por utilizador/mês.
  - IA aplicada a equipas: 5€–20€ por utilizador/mês (dependendo de cloud vs local).
  - Taskify combina estes três segmentos, razão pela qual o preço por escalão reflete o valor agregado.

- Valor percebido e ROI
  - Melhorar +1–3% de produtividade numa equipa de 100 pessoas representa tipicamente 1 000€–3 000€ de valor mensal (consoante salário médio e margem).
  - Um preço fixo de 400€–1 100€/mês fica assim bem dentro de um ratio ROI positivo.

- Estrutura de custos e margem
  - Modelo fixo mensal permite margem saudável e previsibilidade de cash-flow.
  - Escala: custo marginal por utilizador decresce com volume, justificando descontos progressivos nos escalões.

- Contexto geográfico (Portugal/Europa)
  - PME/mid-market: budget típico 250€–1 500€/mês para software de gestão + performance.
  - Enterprise (200+ utilizadores, setores regulados): budget maior, aceita 2 000€+/mês, sobretudo com requisitos de segurança e IA híbrida.

## 7. Diferenciação Estratégica

- Gamificação séria, ligada a objetivos reais (não apenas "jogos de pontos").
- IA aplicada diretamente ao contexto do cliente, não genérica.
- Arquitetura híbrida pensada para mercados com exigências de segurança e privacidade.
- Foco na adoção: UX moderna, integração com ferramentas já existentes, reduzindo fricção.

## 8. Próximos Passos Comerciais

- Definir oferta de piloto:
  - Ex.: 60 dias, 20–50 utilizadores, 1 equipa, objetivos claros e medidos.
- Criar materiais de venda:
  - One-pager baseado neste documento.
  - Deck de 8–12 slides com problema, solução, IA, segurança, casos e planos.
- Focar abordagem inicial em 2–3 segmentos com maior fit (ex.: contact centers e equipas comerciais).

Este documento serve como base estruturada para posicionamento comercial da Taskify junto de empresas, podendo ser adaptado para propostas, apresentações e website.

## 9. Referências e Fontes

Os intervalos de preços e o posicionamento foram inspirados por benchmarks públicos e práticas comuns em SaaS B2B, gamification e performance management. Exemplos de referências que suportam a ordem de grandeza proposta:

- Gamificação corporativa e engagement:
  - Bunchball / BI WORLDWIDE: modelos de gamification B2B orientados a performance.
    - https://www.biworldwide.com/solutions/employee-recognition/gamification/
  - Centrical: plataforma de gamification e performance para contact centers e equipas.
    - https://centrical.com/

- Plataformas de performance, OKR e people success:
  - Lattice
    - https://lattice.com/
  - Leapsome
    - https://www.leapsome.com/
  - Gtmhub
    - https://gtmhub.com/
  - Perdoo
    - https://www.perdoo.com/

- IA aplicada à produtividade e copilots:
  - Microsoft Copilot
    - https://www.microsoft.com/copilot
  - GitHub Copilot
    - https://github.com/features/copilot

- Benchmarks SaaS B2B (Europa/PME/Mid-Market):
  - Observação de faixas típicas de 3€–20€ por utilizador/mês em soluções de colaboração, produtividade, performance e IA.
  - Uso de pacotes mensais entre ~250€ e 1 500€ para equipas 50–250 utilizadores, e planos enterprise customizados (2 000€+/mês) para requisitos avançados.

- Premissas internas de ROI usadas neste documento:
  - Ganhos esperados de +1–3% em produtividade/receita de equipas alvo.
  - Comparação entre esse ganho potencial e o custo mensal dos planos Taskify propostos, garantindo margem confortável para o cliente.

Nota: Estes links servem como referência conceptual e de ordem de grandeza; o pricing final da Taskify deve ser ajustado com base em custos reais, posicionamento estratégico e feedback do mercado-alvo.
