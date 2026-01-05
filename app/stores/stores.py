from __future__ import annotations

from collections import defaultdict
from typing import DefaultDict, Dict, List, Optional
from uuid import UUID

from app.models import Alocacao, Cliente, Titulo


class TitulosStore:
    def __init__(self) -> None:
        self._all: List[Titulo] = []
        self._by_tipo: DefaultDict[str, List[Titulo]] = defaultdict(list)
        self._by_id: Dict[UUID, Titulo] = {}

    def load(self, titulos: List[Titulo]) -> None:
        self._all = list(titulos)
        self._by_tipo.clear()
        self._by_id.clear()
        for t in self._all:
            self._by_tipo[t.tipo].append(t)
            self._by_id[t.id] = t

    def all(self) -> List[Titulo]:
        return list(self._all)

    def by_tipo(self, tipo: str) -> List[Titulo]:
        return list(self._by_tipo.get(tipo.strip().upper(), []))

    def get(self, titulo_id: UUID) -> Optional[Titulo]:
        return self._by_id.get(titulo_id)


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
