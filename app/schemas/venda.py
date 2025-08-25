from pydantic import BaseModel, validator
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

class ItemVendaCreate(BaseModel):
    produto_id: int
    quantidade: int
    preco_unitario: Decimal
    
    @validator('quantidade')
    def quantidade_positiva(cls, v):
        if v <= 0:
            raise ValueError('Quantidade deve ser positiva')
        return v

class ItemVendaResponse(BaseModel):
    id: int
    produto_id: int
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal
    
    class Config:
        from_attributes = True

class VendaCreate(BaseModel):
    itens: List[ItemVendaCreate]
    cpf_cliente: Optional[str] = None
    desconto: Decimal = 0
    forma_pagamento: str = "dinheiro"
    
    @validator('cpf_cliente')
    def validar_cpf(cls, v):
        if v and len(v.replace('.', '').replace('-', '')) != 11:
            raise ValueError('CPF deve ter 11 dígitos')
        return v
    
    @validator('forma_pagamento')
    def validar_forma_pagamento(cls, v):
        formas_validas = ['dinheiro', 'cartao_debito', 'cartao_credito', 'pix']
        if v not in formas_validas:
            raise ValueError('Forma de pagamento inválida')
        return v

class VendaResponse(BaseModel):
    id: int
    total: Decimal
    desconto: Decimal
    cpf_cliente: Optional[str]
    forma_pagamento: str
    nfce_numero: Optional[str]
    nfce_chave: Optional[str]
    nfce_qr_code: Optional[str]
    status: str
    created_at: datetime
    itens: List[ItemVendaResponse] = []
    
    class Config:
        from_attributes = True