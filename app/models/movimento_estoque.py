from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class MovimentoEstoque(Base):
    __tablename__ = "movimentos_estoque"
    
    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    tipo_movimento = Column(String(20), nullable=False)  # entrada, saida, ajuste, venda, compra, perda
    quantidade = Column(Integer, nullable=False)
    quantidade_anterior = Column(Integer, nullable=False)
    quantidade_nova = Column(Integer, nullable=False)
    preco_unitario = Column(DECIMAL(10, 2))
    valor_total = Column(DECIMAL(10, 2))
    motivo = Column(String(200))
    observacoes = Column(String(500))
    usuario = Column(String(50))  # Quem fez a movimentação
    documento = Column(String(100))  # Nota fiscal, pedido de compra, etc.
    
    # Relacionamentos
    produto = relationship("Produto", back_populates="movimentos")
    
    created_at = Column(DateTime, server_default=func.now())