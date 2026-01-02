import os
from uuid import UUID

from fastapi import FastAPI, HTTPException

from app.models import (
    Cliente,
    ClienteComAlocacoes,
    CreateAlocacaoRequest,
    CreateClienteRequest,
    Titulo,
)
from app.services.loader import DataFileError, load_titulos
from app.services.stores import AlocacoesStore, ClientesStore, TitulosStore

app = FastAPI(title="Anova Challenge", version="0.1.0")

titulos_store = TitulosStore()
clientes_store = ClientesStore()
alocacoes_store = AlocacoesStore()


@app.on_event("startup")
def startup():
    path = os.getenv("TITULOS_PATH", "data/titulos.xlsm")
    sheet = os.getenv("TITULOS_SHEET") or None

    try:
        titulos = load_titulos(path, sheet_name=sheet)
        titulos_store.load(titulos)
    except DataFileError as e:
        raise RuntimeError(str(e))


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/titulos", response_model=list[Titulo])
def listar_titulos():
    return titulos_store.all()


@app.get("/titulos/{tipo}", response_model=list[Titulo])
def listar_titulos_por_tipo(tipo: str):
    return titulos_store.by_tipo(tipo)

@app.post("/clientes", response_model=Cliente, status_code=201)
def criar_cliente(payload: CreateClienteRequest):
    return clientes_store.create(payload.nome)


@app.get("/clientes", response_model=list[Cliente])
def listar_clientes():
    return clientes_store.list()


@app.get("/clientes/{cliente_id}", response_model=Cliente)
def obter_cliente(cliente_id: UUID):
    c = clientes_store.get(cliente_id)
    if not c:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return c

@app.post("/clientes/{cliente_id}/alocacoes", status_code=201)
def criar_alocacao(cliente_id: UUID, payload: CreateAlocacaoRequest):
    c = clientes_store.get(cliente_id)
    if not c:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    t = titulos_store.get(payload.titulo_id)
    if not t:
        raise HTTPException(status_code=404, detail="Título não encontrado")

    a = alocacoes_store.create(cliente_id, payload.titulo_id, payload.quantidade)
    return {"alocacao": a, "titulo": t, "cliente": c}


@app.get("/clientes/{cliente_id}/alocacoes", response_model=ClienteComAlocacoes)
def listar_alocacoes(cliente_id: UUID):
    c = clientes_store.get(cliente_id)
    if not c:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    alocs = alocacoes_store.list_by_cliente(cliente_id)
    return {"cliente": c, "alocacoes": alocs}
