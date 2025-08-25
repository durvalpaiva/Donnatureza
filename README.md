# 🌿 Sistema Donnatureza

Sistema completo de gestão comercial desenvolvido especificamente para a loja Donnatureza, com foco em produtos naturais e funcionalidades integradas de vendas, estoque e NFC-e.

## 🌐 Acesso ao Sistema

**Site Oficial**: [www.donnatureza.com.br](https://www.donnatureza.com.br)

## ✨ Funcionalidades

### 🛍️ Gestão de Vendas
- Interface touch-friendly para vendas rápidas
- Scanner de código de barras integrado
- Múltiplas formas de pagamento (Dinheiro, Cartão, PIX)
- Geração automática de cupons de venda
- Integração com NFC-e (em desenvolvimento)

### 📦 Controle de Estoque
- Gestão completa de estoque com níveis mínimos/máximos
- Rastreamento automático de movimentações
- Alertas de estoque baixo e alto
- Sistema de inventário físico com scanner
- Histórico detalhado de todas as movimentações

### 🏪 Catálogo Visual
- Catálogo interativo com fotos dos produtos
- Modo touch para seleção rápida
- Filtros por categoria e busca por nome
- Exportação em PDF e impressão
- Transferência direta para vendas

### 📊 Relatórios e Analytics
- Dashboard com vendas do dia
- Relatórios por período customizável
- Produtos mais vendidos
- Análise de formas de pagamento
- Indicadores de performance

### 🎯 Gestão de Produtos
- Cadastro completo com campos fiscais para NFC-e
- Upload de fotos dos produtos
- Código de barras com scanner integrado
- Categorização avançada
- Campos personalizados para produtos naturais

## 🚀 Tecnologias

### Backend
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para banco de dados
- **PostgreSQL** - Banco de dados em produção
- **Pydantic** - Validação de dados
- **Uvicorn** - Servidor ASGI

### Frontend
- **HTML5/CSS3** - Interface responsiva
- **JavaScript ES6+** - Funcionalidades interativas
- **Jinja2** - Templates dinâmicos
- **Chart.js** - Gráficos e relatórios
- **ZXing** - Scanner de código de barras

### Infraestrutura
- **Railway** - Hospedagem e deploy
- **GitHub** - Controle de versão
- **SSL/HTTPS** - Segurança
- **PostgreSQL** - Banco de dados

## 📱 Interface

### Design Responsivo
- **Desktop**: Interface completa com todos os recursos
- **Tablet**: Otimizada para vendas touch
- **Mobile**: Funcionalidades essenciais

### Experiência do Usuário
- Interface intuitiva para usuários não técnicos
- Feedback visual em todas as ações
- Navegação simplificada
- Atalhos de teclado

## 🔧 Desenvolvimento Local

### Pré-requisitos
```bash
Python 3.12+
Git
```

### Instalação
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/donnatureza.git
cd donnatureza

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar aplicação
uvicorn app.main:app --reload
```

### Acessar
- **Interface**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📂 Estrutura do Projeto

```
donnatureza/
├── app/
│   ├── main.py              # Entry point
│   ├── config.py            # Configurações
│   ├── database.py          # Setup do banco
│   ├── models/              # Modelos SQLAlchemy
│   ├── routers/             # Rotas da API
│   ├── schemas/             # Esquemas Pydantic
│   ├── services/            # Lógica de negócio
│   ├── static/              # CSS, JS, imagens
│   └── templates/           # Templates HTML
├── requirements.txt         # Dependências
├── Procfile                # Comando Railway
├── railway.json           # Config Railway
└── README.md              # Este arquivo
```

## 🔐 Segurança

- ✅ HTTPS obrigatório em produção
- ✅ Variáveis de ambiente para secrets
- ✅ Validação de dados com Pydantic
- ✅ Sanitização de inputs
- ✅ Headers de segurança

## 📈 Performance

- ⚡ FastAPI com async/await
- 📊 Database indexing otimizado
- 🗜️ Compressão de assets
- 📱 Lazy loading de imagens
- 💾 Cache de consultas frequentes

## 🛠️ Manutenção

### Atualizações
Deploy automático via GitHub quando push na branch `main`

### Backup
Backup automático do PostgreSQL pelo Railway

### Monitoramento
- Health checks automáticos
- Logs centralizados no Railway
- Métricas de performance

## 📞 Suporte

Sistema desenvolvido especificamente para Donnatureza por **Dú**.

### Funcionalidades Implementadas
- ✅ Sistema de vendas completo
- ✅ Gestão de estoque avançada
- ✅ Catálogo visual interativo
- ✅ Relatórios e dashboards
- ✅ Scanner de código de barras
- ✅ Interface touch-friendly
- ✅ Deploy em produção

### Próximas Funcionalidades
- 🔲 Integração completa NFC-e
- 🔲 Sistema de clientes/fidelidade
- 🔲 Gestão financeira
- 🔲 App mobile nativo

---

## 🏷️ Versão

**v1.0.0** - Sistema completo em produção

**Última atualização**: Agosto 2024

---

**💚 Desenvolvido com carinho para Donnatureza - Produtos Naturais**