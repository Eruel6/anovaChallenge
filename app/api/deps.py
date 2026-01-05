from fastapi import Request
from app.stores.stores import AlocacoesStore, ClientesStore, TitulosStore

def get_titulos_store(request: Request) -> TitulosStore:
    store = getattr(request.app.state, "titulos_store", None)
    if store is None:
        raise RuntimeError("TitulosStore não inicializado")
    return store

def get_clientes_store(request: Request) -> ClientesStore:
    store = getattr(request.app.state, "clientes_store", None)
    if store is None:
        raise RuntimeError("ClientesStore não inicializado")
    return store

def get_alocacoes_store(request: Request) -> AlocacoesStore:
    store = getattr(request.app.state, "alocacoes_store", None)
    if store is None:
        raise RuntimeError("AlocacoesStore não inicializado")
    return store
