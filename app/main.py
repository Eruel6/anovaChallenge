import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

from pathlib import Path
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routers import clients, health, titles
from app.services.loader import DataFileError, load_titulos
from app.stores.stores import AlocacoesStore, ClientesStore, TitulosStore

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.titulos_store = TitulosStore()
    app.state.clientes_store = ClientesStore()
    app.state.alocacoes_store = AlocacoesStore()

    path = os.getenv("TITULOS_PATH", "data/titulos.xlsm")
    sheet = os.getenv("TITULOS_SHEET") or None

    try:
        titulos = load_titulos(path, sheet_name=sheet)
        app.state.titulos_store.load(titulos)
    except DataFileError as e:
        raise RuntimeError(str(e))

    yield

app = FastAPI(title="Anova Challenge", version="0.1.0", lifespan=lifespan)

app.include_router(health.router)
app.include_router(titles.router)
app.include_router(clients.router)
