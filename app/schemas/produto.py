from pydantic import BaseModel, validator
from typing import Optional
from decimal import Decimal
from datetime import datetime

class ProdutoBase(BaseModel):
    nome: str
    codigo_barras: Optional[str] = None
    preco: Decimal
    estoque: int = 0
    estoque_minimo: int = 5
    estoque_maximo: int = 100
    estoque_inicial: int = 0
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    foto_url: Optional[str] = None
    
    # Campos fiscais
    ncm: str = "00000000"
    cfop: str = "5102"
    unidade_medida: str = "UN"
    origem: str = "0"
    cst_icms: str = "102"
    aliquota_icms: Decimal = Decimal("0.00")
    cst_pis: str = "07"
    aliquota_pis: Decimal = Decimal("0.0000")
    cst_cofins: str = "07"
    aliquota_cofins: Decimal = Decimal("0.0000")
    cst_ipi: Optional[str] = None
    aliquota_ipi: Decimal = Decimal("0.00")
    
    ativo: bool = True

class ProdutoCreate(ProdutoBase):
    @validator('preco')
    def preco_positivo(cls, v):
        if v <= 0:
            raise ValueError('Preço deve ser positivo')
        return v

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    codigo_barras: Optional[str] = None
    preco: Optional[Decimal] = None
    estoque: Optional[int] = None
    estoque_minimo: Optional[int] = None
    estoque_maximo: Optional[int] = None
    estoque_inicial: Optional[int] = None
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    foto_url: Optional[str] = None
    
    # Campos fiscais
    ncm: Optional[str] = None
    cfop: Optional[str] = None
    unidade_medida: Optional[str] = None
    origem: Optional[str] = None
    cst_icms: Optional[str] = None
    aliquota_icms: Optional[Decimal] = None
    cst_pis: Optional[str] = None
    aliquota_pis: Optional[Decimal] = None
    cst_cofins: Optional[str] = None
    aliquota_cofins: Optional[Decimal] = None
    cst_ipi: Optional[str] = None
    aliquota_ipi: Optional[Decimal] = None
    
    ativo: Optional[bool] = None

class ProdutoResponse(ProdutoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True