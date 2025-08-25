from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models import Produto, MovimentoEstoque
from app.services.estoque_service import EstoqueService

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/estoque")
async def tela_estoque(request: Request):
    """Tela de controle de estoque"""
    return templates.TemplateResponse(
        "estoque.html", 
        {"request": request}
    )

@router.get("/api/estoque/alertas")
async def alertas_estoque(db: Session = Depends(get_db)):
    """Obter alertas de estoque baixo e alto"""
    estoque_service = EstoqueService(db)
    
    produtos_estoque_baixo = estoque_service.verificar_estoque_baixo()
    produtos_estoque_alto = estoque_service.verificar_estoque_alto()
    
    return {
        "estoque_baixo": [
            {
                "id": p.id,
                "nome": p.nome,
                "codigo_barras": p.codigo_barras,
                "estoque_atual": p.estoque,
                "estoque_minimo": p.estoque_minimo,
                "categoria": p.categoria
            }
            for p in produtos_estoque_baixo
        ],
        "estoque_alto": [
            {
                "id": p.id,
                "nome": p.nome,
                "codigo_barras": p.codigo_barras,
                "estoque_atual": p.estoque,
                "estoque_maximo": p.estoque_maximo,
                "categoria": p.categoria
            }
            for p in produtos_estoque_alto
        ]
    }

@router.post("/api/estoque/entrada")
async def entrada_estoque(
    produto_id: int,
    quantidade: int,
    preco_unitario: Optional[float] = None,
    motivo: str = "Entrada de estoque",
    documento: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Registrar entrada de estoque"""
    try:
        estoque_service = EstoqueService(db)
        movimento = estoque_service.entrada_estoque(
            produto_id=produto_id,
            quantidade=quantidade,
            preco_unitario=Decimal(str(preco_unitario)) if preco_unitario else None,
            motivo=motivo,
            documento=documento
        )
        
        return {
            "id": movimento.id,
            "produto_id": movimento.produto_id,
            "tipo_movimento": movimento.tipo_movimento,
            "quantidade": movimento.quantidade,
            "quantidade_anterior": movimento.quantidade_anterior,
            "quantidade_nova": movimento.quantidade_nova,
            "motivo": movimento.motivo,
            "created_at": movimento.created_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/api/estoque/ajuste")
async def ajuste_estoque(
    produto_id: int,
    quantidade_nova: int,
    motivo: str = "Ajuste de estoque",
    db: Session = Depends(get_db)
):
    """Ajustar estoque para quantidade específica"""
    try:
        estoque_service = EstoqueService(db)
        movimento = estoque_service.ajuste_estoque(
            produto_id=produto_id,
            quantidade_nova=quantidade_nova,
            motivo=motivo
        )
        
        return {
            "id": movimento.id,
            "produto_id": movimento.produto_id,
            "tipo_movimento": movimento.tipo_movimento,
            "quantidade": movimento.quantidade,
            "quantidade_anterior": movimento.quantidade_anterior,
            "quantidade_nova": movimento.quantidade_nova,
            "motivo": movimento.motivo,
            "created_at": movimento.created_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/estoque/movimentos")
async def listar_movimentos(
    produto_id: Optional[int] = None,
    tipo_movimento: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Listar movimentações de estoque"""
    estoque_service = EstoqueService(db)
    movimentos = estoque_service.obter_movimentos(
        produto_id=produto_id,
        tipo_movimento=tipo_movimento,
        limit=limit
    )
    
    return [
        {
            "id": m.id,
            "produto_id": m.produto_id,
            "produto_nome": m.produto.nome,
            "tipo_movimento": m.tipo_movimento,
            "quantidade": m.quantidade,
            "quantidade_anterior": m.quantidade_anterior,
            "quantidade_nova": m.quantidade_nova,
            "preco_unitario": float(m.preco_unitario) if m.preco_unitario else None,
            "valor_total": float(m.valor_total) if m.valor_total else None,
            "motivo": m.motivo,
            "observacoes": m.observacoes,
            "usuario": m.usuario,
            "documento": m.documento,
            "created_at": m.created_at.isoformat()
        }
        for m in movimentos
    ]

@router.get("/api/estoque/relatorio")
async def relatorio_estoque(db: Session = Depends(get_db)):
    """Relatório geral de estoque"""
    produtos = db.query(Produto).filter(Produto.ativo == True).all()
    
    total_produtos = len(produtos)
    total_valor_estoque = sum(float(p.preco) * p.estoque for p in produtos)
    
    # Contar por categoria
    categorias = {}
    for produto in produtos:
        cat = produto.categoria or "Sem categoria"
        if cat not in categorias:
            categorias[cat] = {"quantidade": 0, "valor": 0}
        categorias[cat]["quantidade"] += produto.estoque
        categorias[cat]["valor"] += float(produto.preco) * produto.estoque
    
    # Produtos sem movimento
    estoque_service = EstoqueService(db)
    produtos_estoque_baixo = len(estoque_service.verificar_estoque_baixo())
    produtos_estoque_alto = len(estoque_service.verificar_estoque_alto())
    
    return {
        "resumo": {
            "total_produtos": total_produtos,
            "total_valor_estoque": total_valor_estoque,
            "produtos_estoque_baixo": produtos_estoque_baixo,
            "produtos_estoque_alto": produtos_estoque_alto
        },
        "categorias": categorias,
        "produtos": [
            {
                "id": p.id,
                "nome": p.nome,
                "categoria": p.categoria,
                "estoque_atual": p.estoque,
                "estoque_minimo": p.estoque_minimo,
                "estoque_maximo": p.estoque_maximo,
                "preco": float(p.preco),
                "valor_total": float(p.preco) * p.estoque,
                "status": (
                    "baixo" if p.estoque <= p.estoque_minimo else
                    "alto" if p.estoque >= p.estoque_maximo else
                    "normal"
                )
            }
            for p in produtos
        ]
    }