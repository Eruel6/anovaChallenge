from __future__ import annotations

from collections import defaultdict
from datetime import date
from decimal import Decimal
from typing import DefaultDict, Dict, List, Optional
from uuid import UUID

from app.models import Alocacao, Cliente, Titulo



class TitulosStore:
    def __init__(self) -> None:
        self._all: List[Titulo] = []
        self._by_tipo: DefaultDict[str, List[Titulo]] = defaultdict(list)
        self._by_emissor: DefaultDict[str, List[Titulo]] = defaultdict(list)
        self._by_id: Dict[UUID, Titulo] = {}

    def load(self, titulos: List[Titulo]) -> None:
        self._all = list(titulos)
        self._by_tipo.clear()
        self._by_emissor.clear()
        self._by_id.clear()

        for t in self._all:
            self._by_tipo[t.tipo].append(t)
            self._by_emissor[t.emissor].append(t)
            self._by_id[t.id] = t

    def all(self) -> List[Titulo]:
        return list(self._all)

    def by_tipo(self, tipo: str) -> List[Titulo]:
        return list(self._by_tipo.get(tipo.strip().upper(), []))

    def by_emissor(self, emissor: str) -> List[Titulo]:
        emissor_norm = " ".join(emissor.strip().split())
        return list(self._by_emissor.get(emissor_norm, []))

    def get(self, titulo_id: UUID) -> Optional[Titulo]:
        return self._by_id.get(titulo_id)

    def filter(
        self,
        *,
        tipo: str | None = None,
        emissor: str | None = None,
        q: str | None = None,
        venc_de: date | None = None,
        venc_ate: date | None = None,
        taxa_min: Decimal | None = None,
        taxa_max: Decimal | None = None,
    ) -> List[Titulo]:
        tipo_norm = tipo.strip().upper() if tipo else None
        emissor_norm = " ".join(emissor.strip().split()) if emissor else None
        q_norm = q.strip().lower() if q else None

        if tipo_norm and emissor_norm:
            base = [t for t in self._by_tipo.get(tipo_norm, []) if t.emissor == emissor_norm]
        elif tipo_norm:
            base = self._by_tipo.get(tipo_norm, [])
        elif emissor_norm:
            base = self._by_emissor.get(emissor_norm, [])
        else:
            base = self._all

        out: List[Titulo] = []
        for t in base:
            if q_norm:
                hay = f"{t.tipo} {t.emissor} {t.id} {t.vencimento} {t.taxa}".lower()
                if q_norm not in hay:
                    continue

            if venc_de and t.vencimento < venc_de:
                continue
            if venc_ate and t.vencimento > venc_ate:
                continue

            if taxa_min is not None and t.taxa < taxa_min:
                continue
            if taxa_max is not None and t.taxa > taxa_max:
                continue

            out.append(t)

        return out


class ClientesStore:
    def __init__(self) -> None:
        self._by_id: Dict[UUID, Cliente] = {}

    def create(self, nome: str) -> Cliente:
        c = Cliente(nome=nome)
        self._by_id[c.id] = c
        return c

    def list(self) -> List[Cliente]:
        return list(self._by_id.values())

    def get(self, cliente_id: UUID) -> Optional[Cliente]:
        return self._by_id.get(cliente_id)


class AlocacoesStore:
    def __init__(self) -> None:
        self._by_cliente: DefaultDict[UUID, List[Alocacao]] = defaultdict(list)

    def create(self, cliente_id: UUID, titulo_id: UUID, quantidade: int) -> Alocacao:
        a = Alocacao(cliente_id=cliente_id, titulo_id=titulo_id, quantidade=quantidade)
        self._by_cliente[cliente_id].append(a)
        return a

    def list_by_cliente(self, cliente_id: UUID) -> List[Alocacao]:
        return list(self._by_cliente.get(cliente_id, []))
