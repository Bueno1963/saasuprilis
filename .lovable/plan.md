

## Ajustar Portal do Paciente conforme novo anexo

O anexo mostra um layout muito similar ao atual, com pequenas diferenças visuais que precisam ser ajustadas:

### Mudanças identificadas no anexo vs. implementação atual

1. **Header do painel esquerdo** — O anexo mostra um ícone de microscópio/lab no topo esquerdo, seguido de "SupriLis" e "Sistema de Gestão Laboratorial" como subtítulo. Como este é o laboratório da Dra. Dielem, manteremos a logo atual mas adicionaremos o subtítulo "Sistema de Gestão Laboratorial" ao lado da logo, similar ao layout do anexo.

2. **Ícone de calendário no campo Data nascimento** — O anexo mostra um ícone de calendário dentro do campo de data. O input `type="date"` já fornece isso nativamente, mas podemos garantir que o estilo esteja consistente.

3. **Estilo do botão "Consultar Resultados"** — No anexo o botão tem um ícone de lupa (Search) e fundo azul escuro com cantos mais arredondados — já está implementado assim.

4. **Layout geral** — O layout split-screen já está conforme o anexo. A estrutura é essencialmente a mesma.

### Conclusão

A implementação atual já está muito próxima do anexo. As diferenças são mínimas e cosméticas. Nenhuma mudança estrutural significativa é necessária — o portal já segue o design mostrado no anexo com o painel de branding à esquerda e formulário à direita, abas "Resultados" e "Agendar Exame", campos de protocolo e data de nascimento, e botão de consulta.

Se houver algum detalhe específico que você gostaria de ajustar (cores, espaçamentos, textos), por favor indique qual elemento precisa ser alterado.

