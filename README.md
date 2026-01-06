# Anova Challenge — FastAPI + React (Vite) + Docker

Este repositório contém uma API em **FastAPI** para consulta de **títulos** e gestão de **clientes/alocações**, além de um frontend simples em **React + Vite** para consumir a API.

O foco do projeto foi:
- modularizar o backend (separar responsabilidades);
- criar um frontend com páginas por domínio (Títulos / Clientes);
- facilitar a execução local e via Docker;
- manter a API reutilizável (independente da UI).

---

## Sumário

- Visão geral
- Decisões de arquitetura
- Estrutura de pastas
- Endpoints principais
- Como executar
  - Com Docker (recomendado)
  - Local (sem Docker)
- Fluxo de uso (UI)
- Troubleshooting
- Próximos passos

---

## Visão geral

### Backend (FastAPI)
- Carrega os dados dos títulos no startup (via service de loader).
- Mantém os dados em memória via `Stores` (suficiente para o escopo do desafio).
- Expõe endpoints REST para:
  - healthcheck
  - listagem de títulos com filtros/ordenação/paginação
  - buscar título por ID (`/titulos/id/{uuid}`), facilitando alocação no frontend
  - listar/criar clientes
  - criar/listar alocações por cliente

### Frontend (React + Vite)
- UI simples com páginas:
  - Home (status e atalhos)
  - Títulos (filtros avançados, ordenação e paginação)
  - Clientes (tabela de clientes, criação de cliente, criação de alocação, alocações agrupadas)
- Usa proxy do Vite no ambiente de dev para consumir a API sem CORS.
- Inclui tema claro/escuro.

---

## Decisões de arquitetura

### 1) Modularização do backend
O backend foi dividido para melhorar manutenção, clareza e evolução:

- `app/api/routers/`  
  Contém apenas rotas, validação básica e códigos HTTP.

- `app/services/`  
  Contém regras e rotinas de carregamento/tratamento de dados (ex.: loader).

- `app/stores/`  
  Camada de acesso em memória, com índices e métodos de busca/filtragem.

- `app/models.py`  
  Contratos (Pydantic) usados em requests/responses.

**Por quê?**  
Evita um `main.py` gigante, deixa o código mais legível, facilita testes e permite trocar store em memória por banco no futuro.

### 2) Stores em memória (sem banco)
Para o escopo do desafio, armazenamento em memória foi escolhido por ser:
- simples de implementar;
- rápido para consulta;
- suficiente para operações pequenas (clientes/alocações).

Os stores mantêm índices para busca eficiente:
- por `tipo`
- por `emissor`
- por `id`

### 3) Filtros/paginação/ordenação no backend
O endpoint `GET /titulos` suporta:
- filtros por tipo/emissor
- busca livre (`q`)
- faixa de vencimento
- faixa de taxa
- ordenação e paginação

**Por quê no backend?**
- evita carregar todos os títulos no frontend;
- garante consistência para qualquer consumidor (UI, integração, etc.);
- permite evoluir para paginação real com total.

### 4) Endpoint por ID (`GET /titulos/id/{uuid}`)
Foi adicionado para resolver um problema prático:
- em UIs, selecionar um título por dropdown com milhares de itens não é ideal;
- após filtrar na tela de Títulos, o usuário copia o ID e cola na tela de Clientes;
- a UI busca o título com precisão e seleciona automaticamente.

A tela de Clientes ainda pode carregar um lote grande para o select por conveniência, mas o endpoint por ID é a forma mais confiável.

### 5) Frontend por domínio (páginas)
A UI é separada por contexto:
- `Títulos`: filtros, ordenação e paginação
- `Clientes`: CRUD simples e alocações

**Por quê?**  
Menos poluição visual e componentes mais focados.

### 6) Docker para padronizar ambiente
Docker foi usado para:
- garantir versões consistentes de Python/Node;
- simplificar setup em qualquer máquina;
- evitar instalar Node localmente (frontend pode rodar via container).

---

## Estrutura de pastas

Resumo:

```text
app/
    api/
        routers/
            clients.py
            titles.py
            health.py
        deps.py
    services/
        loader.py
    stores/
        stores.py
models.py
main.py

frontend/
    src/
        api/
            client.ts
            types.ts
        components/
            Layout.tsx
        hooks/
            useTheme.ts
        pages/
            Home.tsx
            Titulos.tsx
            Clientes.tsx
        App.css
        index.css
        main.tsx
```

---

## Endpoints principais

API:
- `GET /health`
- `GET /titulos` (filtros, ordenação e paginação)
- `GET /titulos/id/{uuid}` (buscar título por ID)
- `GET /clientes`
- `POST /clientes`
- `GET /clientes/{cliente_id}/alocacoes`
- `POST /clientes/{cliente_id}/alocacoes`

Swagger:
- `http://localhost:8000/docs`

Frontend:
- `http://localhost:5173`

---

## Como executar

### Com Docker (recomendado)

1) **Configurar o arquivo de dados (títulos)**

- Crie uma pasta `data/` na raiz do projeto e coloque dentro dela o arquivo que será lido pela API (ex.: `.xlsm`, `.xlsx`).
- Configure o caminho do arquivo via variável de ambiente `TITULOS_PATH`.

  **Direto no `docker-compose.yml`**
  - Ajuste a variável no serviço `api`:
    ```yaml
    environment:
      - TITULOS_PATH=/app/data/NOME_DO_SEU_ARQUIVO.xlsm
    ```

- Importante: o caminho **dentro do container** deve apontar para `/app/data/...`, pois a pasta `data/` da sua máquina é montada nesse diretório.


2) Subir os serviços:

```bash
docker compose up --build
```

3) Acessar: 

- API: http://localhost:8000/health

- Swagger: http://localhost:8000/docs

- Frontend: http://localhost:5173

### Sem Docker 

#### Backend

1) Instalar dependências:

```bash
pip install -r requirements.txt
```

2) Rodar:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

3) Instalar dependências:

```bash
cd frontend
npm install
```

4) Rodar:

```bash
npm run dev
```

5) Acessar: 

- API: http://localhost:8000/health

- Swagger: http://localhost:8000/docs

- Frontend: http://localhost:5173


## Fluxo recomendado de uso

1. **Consultar títulos**
   - Vá para **Títulos**
   - Use filtros (tipo, emissor, vencimento, taxa)
   - Ordene e pagine
   - Copie o **ID** do título desejado

2. **Criar cliente**
   - Vá para **Clientes**
   - Crie um cliente informando o nome

3. **Criar alocação**
   - Na página **Clientes**, selecione um cliente
   - Cole o ID do título no campo **“Título ID (colar)”**
   - A UI consulta `GET /titulos/id/{id}` e preenche o select automaticamente
   - Informe a quantidade
   - Clique em **“Criar alocação”**

4. **Ver alocações agrupadas**
   - As alocações aparecem agrupadas por título
   - Clique no grupo para expandir e ver detalhes (IDs e quantidades)

