# Fusion Starter

The Fusion Starter is a modern, production-ready template for building full-stack React applications using react-router-dom in SPA mode.

## Core Framework & Technologies

- **React 18**
- **React Router 6**: Powers the client-side routing
- **TypeScript**: Type safety is built-in by default
- **Vite**: Bundling and development server
- **Vitest**: For testing
- **TailwindCSS 3**: For styling

## Routing System

The routing system is powered by React Router 7:

- `src/pages/Index.tsx` represents the home page.
- Routes are defined in `src/App.tsx` using the `react-router-dom` import
- Route files are located in the `src/pages/` directory

For example, routes can be defined with:

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<Index />} />
  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
  <Route path="*" element={<NotFound />} />
</Routes>;
```

## Styling System

The styling system combines several technologies:

- **TailwindCSS 3**: Used as the primary styling method with utility classes
- **tailwind.config.ts**: Used to describe the design system tokens, update this file to change the whole look and feel
- **CSS Imports**: Base styles are imported in `src/index.css`
- **UI Component Library**: A comprehensive set of pre-styled UI components in `src/components/ui/` built with:
  - Radix UI: For accessible UI primitives
  - Class Variance Authority: For component variants
  - TailwindCSS: For styling
  - Lucide React: For icons
  - Lots of utility components, like carousels, calendar, alerts...
- **Class Name Utility**: The codebase includes a `cn` utility function from `@/lib/utils` that combines the functionality of `clsx` and `tailwind-merge`. Here's how it's typically used:

  ```typescript
  // A complex example showing the power of the cn utility
  function CustomComponent(props) {
    return (
      <div
        className={cn(
          // Base styles always applied
          "flex items-center rounded-md transition-all duration-200",

          // Object syntax for conditional classes - keys are class names, values are boolean expressions
          {
            // Size-based classes
            "text-xs p-1.5 gap-1": props.size === "sm",
            "text-base p-3.5 gap-3": props.size === "lg",

            // Width control
            "w-full": isFullWidth,
            "w-auto": !isFullWidth,
          },

          // Error state overrides other states
          props.hasError && "border-red-500 text-red-700 bg-red-50",

          // User-provided className comes last for highest precedence
          props.className
        )}
      />
    );
  }
  ```

The styling system supports dark mode through CSS variables and media queries.

## Testing

- **Unit Testing Utilities**: Utility functions such as `cn` in `src/lib/utils.ts` are covered by dedicated unit tests in `src/lib/utils.spec.ts`.
- **Testing Framework**: Tests are written using [Vitest](https://vitest.dev/), which provides a Jest-like API and fast performance for Vite projects.
- **Adding More Tests**: Place new utility tests in the same directory as the utility, using the `.spec.ts` suffix.

## Development Workflow

- **Development**: `npm run dev` - Starts the development server with HMR
- **Production Build**: `npm run build` - Creates optimized production build
- **Type Checking**: `npm run typecheck` - Validates TypeScript types
- **Run tests**: `npm test` - Run all .spec tests

## Architecture Overview

The architecture follows a modern React application structure:

```
package.json
app/
├── components/     # Reusable UI components
│   └── ui/         # Core UI component library
├── routes/         # Route components and logic
├── app.css         # Global styles
├── root.tsx        # Root layout and error boundary
└── routes.ts       # Route configuration
```

This structure provides a clean separation of concerns between UI components, routes, and application logic.

## Design System / Branding (JuriSync)

A marca JuriSync usa a seguinte paleta institucional. Estas cores devem substituir os tokens genéricos do shadcn em `src/index.css` / `tailwind.config.ts` ao longo da refatoração de UI/UX.

- **Tinta** `#1B2B4B` — azul-marinho institucional; texto da marca e fundos escuros.
- **Verde** `#3F8C68` — acento (a barra inferior da balança). Em fundo escuro, usar `#5BA87F`.
- **Papel** `#F5F4F0` — fundo neutro alternativo ao branco.
- **Preto** `#000000` — só na versão monocromática (carimbo, gravação, fax, sobre fotografia).

### Assets de logo

Todos os arquivos estão em `public/logos/svg/` e `public/logos/png/`.

| Uso | Arquivo |
|---|---|
| Cabeçalho do sistema, documentos, e-mail (fundo claro) | `jurisync-horizontal.svg` / `.png` |
| Fundo escuro / barra de navegação em tinta | `jurisync-horizontal-branco.svg` / `.png` |
| Espaços quadrados: capa de proposta, redes sociais, crachá (claro) | `jurisync-vertical.svg` / `.png` |
| Espaços quadrados (fundo escuro) | `jurisync-vertical-branco.svg` |
| Favicon do navegador — símbolo em quadrado tinta, cantos arredondados | `jurisync-favicon.svg` |
| Ícone de app / atalho — 1024×1024, pronto para iOS, Android e PWA | `jurisync-icone-1024.png` |
| Avatar, marca d'água, símbolo solto (claro) | `jurisync-simbolo.svg` / `.png` |
| Avatar, marca d'água, símbolo solto (escuro) | `jurisync-simbolo-branco.svg` / `.png` |
| Carimbo, gravação, fax, sobre fotografia — horizontal mono preto | `jurisync-horizontal-mono-preto.svg` / `.png` |
| Carimbo, gravação, fax, sobre fotografia — símbolo mono preto (fundo claro) | `jurisync-simbolo-mono-preto.svg` |
| Carimbo, gravação, fax, sobre fotografia — símbolo mono branco (fundo escuro) | `jurisync-simbolo-mono-branco.svg` |

### Plano de refatoração de UI/UX

Direção: linguagem visual de processo jurídico físico (dossiê, carimbo, numeração de protocolo, papel) executada com precisão de software — evitando tanto o "SaaS azul-corporativo genérico" quanto o cliché "escritório = serifa dourada".

**Tokens de cor** (a atualizar em `src/index.css`):
- Primária → Tinta `#1B2B4B`
- Acento (ações positivas/sucesso, elemento da marca) → Verde `#3F8C68` (light) / `#5BA87F` (dark)
- Fundo alternativo → Papel `#F5F4F0`
- Mono → Preto `#000000` (uso restrito a contexto de documento/carimbo)
- Manter um tom terracota/vermelho separado (já existente via `--destructive`) reservado exclusivamente para estado crítico/prazo vencendo — nunca decorativo.

**Tipografia**: par com contraste de função — serifada institucional para títulos de página e números de processo/contrato; sans grotesk neutra para UI e corpo de texto. Sem itálico/negrito pontual em palavra única do título, sem ALL CAPS em labels.

**Layout**: sidebar mais estreita ("lombada de dossiê"), hairlines em vez de `box-shadow` genérico em cards, radius reduzido e consistente com a função (0 em tabelas/listas, sutil em elementos interativos). Logo horizontal (`jurisync-horizontal.svg`) no header sobre fundo claro; trocar para `jurisync-horizontal-branco.svg` na sidebar/nav em tinta.

**Ordem de execução**:
1. Tokens em `src/index.css` e `tailwind.config.ts` (cores, radius por contexto).
2. Componentes-base em `src/components/ui/` (Button, Card, Badge, Table) — remover sombra genérica, revisar foco/acessibilidade.
3. Layout global: `Sidebar.tsx`, `Header`, `NotificationCenter.tsx` — aplicar logos e paleta nova.
4. Favicon (`jurisync-favicon.svg`) e ícone PWA (`jurisync-icone-1024.png`) em `index.html` / manifest.
5. Páginas por ordem de tráfego: Dashboard → Contracts/ContractDetails → Processes → Folders → Chat/Companies/Settings.
6. Copy pass: labels, empty states, mensagens de erro em voz ativa e vocabulário jurídico real.
7. QA visual: screenshots antes/depois, contraste, navegação por teclado, `prefers-reduced-motion`, responsivo mobile.
