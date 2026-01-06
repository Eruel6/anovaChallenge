from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_titulos_store
from app.models import Titulo
from app.stores.stores import TitulosStore

router = APIRouter(prefix="/titulos", tags=["titulos"])

SORT_FIELDS = {"vencimento", "taxa", "tipo", "emissor"}


@router.get("", response_model=list[Titulo])
def listar_titulos(
    tipo: str | None = Query(None, description="Ex: CDB, LCA"),
    emissor: str | None = Query(None, description="Ex: Banco ABC"),
    q: str | None = Query(None, description="Busca livre (tipo/emissor/id/vencimento/taxa)"),
    venc_de: date | None = Query(None, description="YYYY-MM-DD"),
    venc_ate: date | None = Query(None, description="YYYY-MM-DD"),
    taxa_min: Decimal | None = Query(None, description="Taxa mínima"),
    taxa_max: Decimal | None = Query(None, description="Taxa máxima"),
    sort: str = Query("vencimento", description="vencimento|taxa|tipo|emissor"),
    order: str = Query("asc", description="asc|desc"),
    limit: int = Query(50, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    titulos_store: TitulosStore = Depends(get_titulos_store),
):
    items = titulos_store.filter(
        tipo=tipo,
        emissor=emissor,
        q=q,
        venc_de=venc_de,
        venc_ate=venc_ate,
        taxa_min=taxa_min,
        taxa_max=taxa_max,
    )

    if sort not in SORT_FIELDS:
        sort = "vencimento"

    reverse = (order or "").lower() == "desc"
    key_fn = {
        "vencimento": lambda t: t.vencimento,
        "taxa": lambda t: t.taxa,
        "tipo": lambda t: t.tipo,
        "emissor": lambda t: t.emissor,
    }[sort]

    items.sort(key=key_fn, reverse=reverse)
    return items[offset : offset + limit]


@router.get("/id/{titulo_id}", response_model=Titulo)
def obter_titulo_por_id(
    titulo_id: UUID,
    titulos_store: TitulosStore = Depends(get_titulos_store),
):
    t = titulos_store.get(titulo_id)
    if not t:
        raise HTTPException(status_code=404, detail="Título não encontrado")
    return t


@router.get("/meta")
def meta_titulos(titulos_store: TitulosStore = Depends(get_titulos_store)):
    """
    Opcional, mas útil pro frontend montar filtros sem precisar buscar 1000 itens.
    """
    all_items = titulos_store.all()
    tipos = sorted({t.tipo for t in all_items})
    emissores = sorted({t.emissor for t in all_items})
    return {"total": len(all_items), "tipos": tipos, "emissores": emissores}


@router.get("/{tipo}", response_model=list[Titulo], deprecated=True)
def listar_titulos_por_tipo(tipo: str, titulos_store: TitulosStore = Depends(get_titulos_store)):
    return titulos_store.by_tipo(tipo)
