from sqlalchemy.orm import Session
from app.models import Produto, MovimentoEstoque, Venda, ItemVenda
from typing import Optional
from decimal import Decimal

class EstoqueService:
    def __init__(self, db: Session):
        self.db = db
    
    def criar_movimento(
        self,
        produto_id: int,
        tipo_movimento: str,
        quantidade: int,
        preco_unitario: Optional[Decimal] = None,
        motivo: Optional[str] = None,
        observacoes: Optional[str] = None,
        usuario: str = "sistema",
        documento: Optional[str] = None
    ) -> MovimentoEstoque:
        """Criar um movimento de estoque"""
        produto = self.db.query(Produto).filter(Produto.id == produto_id).first()
        if not produto:
            raise ValueError(f"Produto {produto_id} não encontrado")
        
        quantidade_anterior = produto.estoque
        
        # Calcular nova quantidade baseada no tipo de movimento
        if tipo_movimento in ['entrada', 'compra', 'ajuste_positivo']:
            quantidade_nova = quantidade_anterior + quantidade
        elif tipo_movimento in ['saida', 'venda', 'perda', 'ajuste_negativo']:
            quantidade_nova = quantidade_anterior - quantidade
            if quantidade_nova < 0:
                raise ValueError(f"Estoque insuficiente. Atual: {quantidade_anterior}, Solicitado: {quantidade}")
        else:
            raise ValueError(f"Tipo de movimento inválido: {tipo_movimento}")
        
        # Criar movimento
        movimento = MovimentoEstoque(
            produto_id=produto_id,
            tipo_movimento=tipo_movimento,
            quantidade=quantidade,
            quantidade_anterior=quantidade_anterior,
            quantidade_nova=quantidade_nova,
            preco_unitario=preco_unitario,
            valor_total=preco_unitario * quantidade if preco_unitario else None,
            motivo=motivo,
            observacoes=observacoes,
            usuario=usuario,
            documento=documento
        )
        
        # Atualizar estoque do produto
        produto.estoque = quantidade_nova
        
        self.db.add(movimento)
        self.db.commit()
        self.db.refresh(movimento)
        
        return movimento
    
    def processar_venda(self, venda: Venda) -> list[MovimentoEstoque]:
        """Processar saída de estoque para uma venda"""
        movimentos = []
        
        for item in venda.itens:
            movimento = self.criar_movimento(
                produto_id=item.produto_id,
                tipo_movimento='venda',
                quantidade=item.quantidade,
                preco_unitario=item.preco_unitario,
                motivo=f"Venda #{venda.id}",
                usuario="vendedor",
                documento=f"VENDA-{venda.id}"
            )
            movimentos.append(movimento)
        
        return movimentos
    
    def entrada_estoque(
        self,
        produto_id: int,
        quantidade: int,
        preco_unitario: Optional[Decimal] = None,
        motivo: str = "Entrada de estoque",
        documento: Optional[str] = None
    ) -> MovimentoEstoque:
        """Registrar entrada de estoque"""
        return self.criar_movimento(
            produto_id=produto_id,
            tipo_movimento='entrada',
            quantidade=quantidade,
            preco_unitario=preco_unitario,
            motivo=motivo,
            documento=documento
        )
    
    def ajuste_estoque(
        self,
        produto_id: int,
        quantidade_nova: int,
        motivo: str = "Ajuste de estoque"
    ) -> MovimentoEstoque:
        """Ajustar estoque para uma quantidade específica"""
        produto = self.db.query(Produto).filter(Produto.id == produto_id).first()
        if not produto:
            raise ValueError(f"Produto {produto_id} não encontrado")
        
        diferenca = quantidade_nova - produto.estoque
        if diferenca == 0:
            raise ValueError("Quantidade já está correta")
        
        tipo_movimento = 'ajuste_positivo' if diferenca > 0 else 'ajuste_negativo'
        
        return self.criar_movimento(
            produto_id=produto_id,
            tipo_movimento=tipo_movimento,
            quantidade=abs(diferenca),
            motivo=motivo
        )
    
    def verificar_estoque_baixo(self) -> list[Produto]:
        """Retornar produtos com estoque abaixo do mínimo"""
        return (self.db.query(Produto)
                .filter(Produto.estoque <= Produto.estoque_minimo)
                .filter(Produto.ativo == True)
                .all())
    
    def verificar_estoque_alto(self) -> list[Produto]:
        """Retornar produtos com estoque acima do máximo"""
        return (self.db.query(Produto)
                .filter(Produto.estoque >= Produto.estoque_maximo)
                .filter(Produto.ativo == True)
                .all())
    
    def obter_movimentos(
        self,
        produto_id: Optional[int] = None,
        tipo_movimento: Optional[str] = None,
        limit: int = 100
    ) -> list[MovimentoEstoque]:
        """Obter histórico de movimentações"""
        query = self.db.query(MovimentoEstoque)
        
        if produto_id:
            query = query.filter(MovimentoEstoque.produto_id == produto_id)
        
        if tipo_movimento:
            query = query.filter(MovimentoEstoque.tipo_movimento == tipo_movimento)
        
        return query.order_by(MovimentoEstoque.created_at.desc()).limit(limit).all()