from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import (
    get_alocacoes_store,
    get_clientes_store,
    get_titulos_store,
)
from app.models import (
    Cliente,
    ClienteComAlocacoes,
    CreateAlocacaoRequest,
    CreateClienteRequest,
)
from app.stores.stores import AlocacoesStore, ClientesStore, TitulosStore

router = APIRouter(prefix="/clientes", tags=["clientes"])

@router.post("", response_model=Cliente, status_code=201)
def criar_cliente(
    payload: CreateClienteRequest,
    clientes_store: ClientesStore = Depends(get_clientes_store),
):
    return clientes_store.create(payload.nome)

@router.get("", response_model=list[Cliente])
def listar_clientes(clientes_store: ClientesStore = Depends(get_clientes_store)):
    return clientes_store.list()

@router.get("/{cliente_id}", response_model=Cliente)
def obter_cliente(cliente_id: UUID, clientes_store: ClientesStore = Depends(get_clientes_store)):
    c = clientes_store.get(cliente_id)
    if not c:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return c

@router.post("/{cliente_id}/alocacoes", status_code=201)
def criar_alocacao(
    cliente_id: UUID,
    payload: CreateAlocacaoRequest,
    clientes_store: ClientesStore = Depends(get_clientes_store),
    titulos_store: TitulosStore = Depends(get_titulos_store),
    alocacoes_store: AlocacoesStore = Depends(get_alocacoes_store),
):
    c = clientes_store.get(cliente_id)
    if not c:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    t = titulos_store.get(payload.titulo_id)
    if not t:
        raise HTTPException(status_code=404, detail="Título não encontrado")

    a = alocacoes_store.create(cliente_id, payload.titulo_id, payload.quantidade)
    return {"alocacao": a, "titulo": t, "cliente": c}

@router.get("/{cliente_id}/alocacoes", response_model=ClienteComAlocacoes)
def listar_alocacoes(
    cliente_id: UUID,
    clientes_store: ClientesStore = Depends(get_clientes_store),
    alocacoes_store: AlocacoesStore = Depends(get_alocacoes_store),
):
    c = clientes_store.get(cliente_id)
    if not c:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    alocs = alocacoes_store.list_by_cliente(cliente_id)
    return {"cliente": c, "alocacoes": alocs}
