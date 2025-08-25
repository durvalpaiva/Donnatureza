from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Produto(Base):
    __tablename__ = "produtos"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    codigo_barras = Column(String(20), unique=True, index=True)
    preco = Column(DECIMAL(10, 2), nullable=False)
    estoque = Column(Integer, default=0)
    estoque_minimo = Column(Integer, default=5)
    estoque_maximo = Column(Integer, default=100)
    estoque_inicial = Column(Integer, default=0)
    categoria = Column(String(50))
    descricao = Column(Text)
    foto_url = Column(String(255))
    
    # Campos fiscais obrigatórios
    ncm = Column(String(8), nullable=False, default="00000000")
    cfop = Column(String(4), default="5102")
    unidade_medida = Column(String(6), default="UN")
    origem = Column(String(1), default="0")  # 0-Nacional, 1-Estrangeiro, 2-Importado
    cst_icms = Column(String(3), default="102")  # Código de situação tributária ICMS
    aliquota_icms = Column(DECIMAL(5, 2), default=0.00)
    cst_pis = Column(String(2), default="07")
    aliquota_pis = Column(DECIMAL(5, 4), default=0.0000)
    cst_cofins = Column(String(2), default="07")
    aliquota_cofins = Column(DECIMAL(5, 4), default=0.0000)
    cst_ipi = Column(String(2), nullable=True)
    aliquota_ipi = Column(DECIMAL(5, 2), default=0.00)
    
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    movimentos = relationship("MovimentoEstoque", back_populates="produto")