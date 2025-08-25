from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Venda(Base):
    __tablename__ = "vendas"
    
    id = Column(Integer, primary_key=True, index=True)
    total = Column(DECIMAL(10, 2), nullable=False)
    desconto = Column(DECIMAL(10, 2), default=0)
    cpf_cliente = Column(String(14), nullable=True)
    forma_pagamento = Column(String(20), default="dinheiro")
    nfce_numero = Column(String(20), nullable=True)
    nfce_chave = Column(String(44), nullable=True)
    nfce_qr_code = Column(Text, nullable=True)
    status = Column(String(20), default="pendente")  # pendente, autorizada, cancelada
    created_at = Column(DateTime, server_default=func.now())
    
    # Relacionamentos
    itens = relationship("ItemVenda", back_populates="venda")

class ItemVenda(Base):
    __tablename__ = "itens_venda"
    
    id = Column(Integer, primary_key=True, index=True)
    venda_id = Column(Integer, ForeignKey("vendas.id"))
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    quantidade = Column(Integer, nullable=False)
    preco_unitario = Column(DECIMAL(10, 2), nullable=False)
    
    # Relacionamentos
    venda = relationship("Venda", back_populates="itens")
    produto = relationship("Produto")
    
    @property
    def subtotal(self):
        return self.quantidade * self.preco_unitario