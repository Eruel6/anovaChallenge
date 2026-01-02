from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator


class Titulo(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tipo: str = Field(min_length=2, max_length=40)
    vencimento: date
    taxa: Decimal = Field(ge=Decimal("-100"), lt=Decimal("500"))
    emissor: str = Field(min_length=2, max_length=120)

    @field_validator("tipo")
    @classmethod
    def normaliza_tipo(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("emissor")
    @classmethod
    def normaliza_emissor(cls, v: str) -> str:
        return " ".join(v.strip().split())

    @field_validator("vencimento", mode="before")
    @classmethod
    def parse_vencimento(cls, v):
        if isinstance(v, datetime):
            return v.date()
        return v

    @field_validator("taxa", mode="before")
    @classmethod
    def parse_taxa(cls, v):
        """
        Suporta:
        - números do Excel em fração (0.0988 -> 9.88)
        - números tipo 1.001 (%CDI) -> 100.1
        - strings tipo "122% CDI" -> 122
        - strings "12,5%" -> 12.5
        """
        if v is None:
            return v
        
        if isinstance(v, (int, float, Decimal)):
            d = Decimal(str(v))
            if d > 0 and d <= 3:
                d = d * 100
            return d

        s = str(v).strip()

        m = re.search(r"(-?\d+(?:[.,]\d+)?)", s)
        if not m:
            raise ValueError(f"taxa inválida: {v}")

        num = m.group(1).replace(",", ".")
        d = Decimal(num)

        if "%" not in s and d > 0 and d <= 3:
            d = d * 100

        return d


class Cliente(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    nome: str = Field(min_length=2, max_length=80)


class Alocacao(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    cliente_id: UUID
    titulo_id: UUID
    quantidade: int = Field(ge=1)


class CreateClienteRequest(BaseModel):
    nome: str = Field(min_length=2, max_length=80)


class CreateAlocacaoRequest(BaseModel):
    titulo_id: UUID
    quantidade: int = Field(ge=1)


class ClienteComAlocacoes(BaseModel):
    cliente: Cliente
    alocacoes: List[Alocacao]
