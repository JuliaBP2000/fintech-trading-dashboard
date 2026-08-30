# Aurora Invest

Dashboard de investimentos em React, com cotações via Alpaca, autenticação local e PostgreSQL.

## Ícones: Flaticon UIcons

O projeto já possui o pacote `@flaticon/flaticon-uicons`. Para escolher ícones, abra o [catálogo UIcons da Flaticon](https://www.flaticon.com/uicons), pesquise pelo que representa a ação desejada e copie o nome da classe exibida pelo ícone.

Para manter a interface elegante e consistente, o estilo recomendado é **Regular Rounded**. Ele usa o prefixo `fi-rr-`.

### 1. Carregue o estilo uma vez

Adicione este import em `src/index.jsx` (ou em `src/index.css`):

```jsx
import '@flaticon/flaticon-uicons/css/regular/rounded.css';
```

### 2. Use a classe no componente

Se o catálogo mostrar o ícone `chart-histogram`, use:

```jsx
<i className="fi-rr-chart-histogram" aria-hidden="true" />
```

Para um botão com texto acessível:

```jsx
<button aria-label="Mercados" title="Mercados">
  <i className="fi-rr-chart-line-up" aria-hidden="true" />
</button>
```

`aria-hidden="true"` informa ao leitor de tela que o significado do botão já está no `aria-label`.

### Sugestões para a sidebar

| Área | Termo para buscar no catálogo | Exemplo de classe |
| --- | --- | --- |
| Visão geral | `dashboard` ou `chart histogram` | `fi-rr-chart-histogram` |
| Mercados | `chart line up` ou `trend up` | `fi-rr-chart-line-up` |
| Ordens | `shopping cart` ou `exchange` | `fi-rr-exchange` |
| Histórico | `time past` ou `clock` | `fi-rr-time-past` |
| Perfil | `user` | `fi-rr-user` |
| Configurações | `settings` ou `gear` | `fi-rr-settings` |

### Outros estilos disponíveis

Troque apenas o arquivo importado e o prefixo da classe:

| Estilo | Import | Prefixo |
| --- | --- | --- |
| Regular Rounded (recomendado) | `@flaticon/flaticon-uicons/css/regular/rounded.css` | `fi-rr-` |
| Regular Straight | `@flaticon/flaticon-uicons/css/regular/straight.css` | `fi-rs-` |
| Solid Rounded | `@flaticon/flaticon-uicons/css/solid/rounded.css` | `fi-sr-` |
| Bold Rounded | `@flaticon/flaticon-uicons/css/bold/rounded.css` | `fi-br-` |
| Thin Rounded | `@flaticon/flaticon-uicons/css/thin/rounded.css` | `fi-tr-` |

Evite importar todos os estilos ao mesmo tempo: escolha um para manter o visual uniforme e reduzir o CSS carregado.

## Executar o projeto

```powershell
# Terminal 1: API e WebSocket
node server/index.mjs

# Terminal 2: React
npm.cmd start
```

As credenciais locais e da Alpaca ficam no arquivo `.env`, que não deve ser publicado.
