from fastapi import APIRouter, Depends
from app.models import Titulo
from app.api.deps import get_titulos_store
from app.stores.stores import TitulosStore

router = APIRouter(prefix="/titulos", tags=["titulos"])

@router.get("", response_model=list[Titulo])
def listar_titulos(titulos_store: TitulosStore = Depends(get_titulos_store)):
    return titulos_store.all()

@router.get("/{tipo}", response_model=list[Titulo])
def listar_titulos_por_tipo(tipo: str, titulos_store: TitulosStore = Depends(get_titulos_store)):
    return titulos_store.by_tipo(tipo)
