#  JuriSync - Sistema Completo de Gestão Jurídica

JuriSync é uma plataforma completa para gestão jurídica e administrativa de contratos, desenvolvida com tecnologias modernas e focada na colaboração em equipe e segurança.

## ✨ Funcionalidades Implementadas

###  Sistema de Autenticação e Autorização

- **Login/Registro** com validação completa
- **Três níveis de usuário**: Administrador, Gerente, Usuário
- **Sistema de convites** com códigos únicos
- **Controle de permissões** granular por funcionalidade
- **Proteção de rotas** baseada em roles
- **Sessão persistente** com localStorage

###  Gerenciamento de Usuários (Admin)

- **Listagem completa** de usuários do sistema
- **Criação de códigos de convite** personalizados
- **Controle de permissões** por cargo
- **Status de usuários** (ativo/inativo)
- **Histórico de acessos** e atividades
- **Gestão de departamentos** e organizações

###  Gestão Avançada de Contratos

- **Upload inteligente** de PDF/DOCX com parser automático
- **Extração automática** de dados contratuais
- **Visualização em tabela** e cards responsivos
- **Sistema de comentários** e histórico
- **Controle de status** com alertas visuais
- **Notificações automáticas** de vencimento
- **Sistema de anexos** e documentos

### 📁 Organização por Pastas (Em desenvolvimento)

- **Pastas personalizadas** para organizar contratos
- **Hierarquia de pastas** com sub-pastas
- **Pastas do sistema** (Ativos, Vencendo, etc.)
- **Permissões por pasta** e controle de acesso
- **Cores e ícones** personalizáveis

###  Dashboard e Analytics

- **Estatísticas em tempo real** de contratos
- **Gráficos interativos** com Recharts
- **Análises financeiras** e de performance
- **Filtros avançados** multi-critério
- **Busca global** em tempo real
- **Exportações** em CSV e PDF

### Sistema de Notificações

- **E-mails automáticos** de vencimento
- **Templates profissionais** em HTML
- **Agendamento inteligente** (7 dias + dia do vencimento)
- **Histórico de notificações** enviadas
- **Configurações personalizáveis** por usuário

### Exportações Profissionais

- **CSV** compatível com Excel/Google Sheets
- **PDF** com dashboards e gráficos
- **Filtros customizáveis** para exportação
- **Presets rápidos** para diferentes cenários

## Arquitetura Técnica

### Frontend Stack

- **React 18** - Interface moderna com hooks
- **TypeScript** - Type safety completa
- **Tailwind CSS** - Design system consistente
- **React Router 6** - Navegação SPA
- **React Query** - State management
- **Radix UI** - Componentes acessíveis
- **Recharts** - Gráficos interativos
- **Framer Motion** - Animações suaves
- **Sonner** - Sistema de toasts

### Padrões de Desenvolvimento

- **Context API** - Gerenciamento de estado global
- **Custom Hooks** - Lógica reutilizável
- **Protected Routes** - Controle de acesso
- **Layout System** - Componentes de layout
- **Permission System** - Controle granular
- **Mock Data** - Dados de demonstração

### Estrutura de Arquivos

```
src/
├── components/          # Componentes reutilizáveis
│   ├── auth/           # Autenticação e proteção
│   ├── contracts/      # Componentes de contratos
│   ├── layout/         # Layout principal (Header, Sidebar)
│   ├── charts/         # Gráficos e visualizações
│   └── ui/             # Biblioteca de componentes base
├── contexts/           # Context API (Auth, etc.)
├── pages/              # Páginas principais
├── types/              # Definições TypeScript
├── lib/                # Utilitários e helpers
└── hooks/              # React hooks customizados
```

## 🎯 Sistema de Permissões

### Administrador

- Todas as funcionalidades
- Gerenciar usuários e convites
- Configurações globais
- Acesso completo a analytics
- Exportar todos os dados

### Gerente

- ✅ Visualizar e criar contratos
- ✅ Editar contratos próprios
- ✅ Criar e gerenciar pastas
- ✅ Exportar dados
- ✅ Configurar notificações
- ❌ Gerenciar usuários

### Usuário

- ✅ Visualizar contratos
- ✅ Criar novos contratos
- ✅ Comentar em contratos
- ❌ Editar contratos
- ❌ Deletar contratos
- ❌ Exportar dados
- ❌ Gerenciar pastas

## 🚀 Como Executar

### 1. Instalação

```bash
# Clone o repositório
git clone [repositório]
cd jurisync

# Instale dependências
npm install
```

### 2. Desenvolvimento

```bash
# Execute o servidor de desenvolvimento
npm run dev

# Acesse: http://localhost:8080
```

### 3. Credenciais de Demonstração

```
👑 Administrador:
   Email: admin@jurisync.com
   Senha: admin123

👔 Gerente:
   Email: joao@jurisync.com
   Senha: joao123

👤 Usuário:
   Email: maria@jurisync.com
   Senha: maria123

🎫 Código de Convite: JURISYNC2024
```

## Interface e Experiência

### Design System

- **Paleta de cores** consistente e profissional
- **Tipografia** hierárquica e legível
- **Espaçamentos** harmoniosos (Tailwind spacing)
- **Componentes** reutilizáveis com variants
- **Dark mode** suporte nativo

### Responsividade

- **Mobile-first** design approach
- **Breakpoints** otimizados para todos devices
- **Sidebar** colapsível em mobile
- **Tabelas** com scroll horizontal
- **Cards** adaptáveis por grid system

### Acessibilidade

- **ARIA labels** em todos componentes
- **Navegação por teclado** completa
- **Contraste** adequado (WCAG 2.1)
- **Screen readers** compatível
- **Focus indicators** visíveis

## 🔧 Funcionalidades Principais

### 1. Fluxo de Upload de Contratos

1. Usuário faz upload de PDF/DOCX
2. Sistema valida formato e tamanho
3. Parser extrai dados automaticamente
4. Usuário revisa e confirma dados
5. Contrato é salvo no sistema
6. Notificações são configuradas

### 2. Sistema de Filtros

- **Busca textual** em tempo real
- **Status** (Ativo, Vencendo, Vencido)
- **Período** de vencimento
- **Responsável** interno
- **Empresa** contratante
- **Combinação** de múltiplos filtros

### 3. Workflow de Notificações

1. Sistema verifica diariamente contratos
2. Identifica vencimentos em 7 dias
3. Gera e-mails personalizados
4. Envia para responsáveis
5. Registra histórico de envios
6. Permite reenvios manuais

### 4. Gestão de Equipes

1. Admin cria códigos de convite
2. Novos usuários se registram
3. Sistema atribui permissões por cargo
4. Usuários colaboram em contratos
5. Histórico completo de ações

## Performance e Escalabilidade

### Otimizações Implementadas

- **Lazy loading** de rotas e componentes
- **Memoização** com React.memo e useMemo
- **Virtual scrolling** para listas grandes
- **Debounced search** para filtros
- **Optimistic updates** em formulários

### Monitoramento

- **Error boundaries** para captura de erros
- **Analytics** de performance
- **Logging** de ações críticas
- **Métricas** de uso do sistema

## Roadmap Futuro

### Próximas Funcionalidades

- **Pastas avançadas** com drag-and-drop
- **Integrações** com e-mail providers
- **OCR avançado** para PDFs complexos
- **Workflow** de aprovações
- **API REST** completa
- **Mobile app** nativo
- **Relatórios** customizáveis
- **Backup** automático

### Integrações Planejadas

- **Microsoft Office 365**
- **Google Workspace**
- **DocuSign** para assinaturas
- **Slack/Teams** para notificações
- **Zapier** para automações

## Logs de Desenvolvimento

### Versão 1.0 (Atual)

- ✅ Sistema de autenticação completo
- ✅ Gestão de usuários e permissões
- ✅ Upload e análise de contratos
- ✅ Dashboard com analytics
- ✅ Sistema de notificações
- ✅ Exportações profissionais
- ✅ Interface responsiva

### Bugfixes Recentes

- 🐛 Corrigido erro em SelectItem vazio (Radix UI)
- 🐛 Melhorada validação de uploads
- 🐛 Otimizada performance de filtros
- 🐛 Corrigidas rotas protegidas

---


