from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, date
from typing import Optional

from app.database import get_db
from app.models.venda import Venda, ItemVenda
from app.models.produto import Produto

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/relatorios")
async def tela_relatorios(request: Request):
    return templates.TemplateResponse(
        "relatorios.html", 
        {"request": request}
    )

@router.get("/api/relatorios/vendas-periodo")
async def vendas_por_periodo(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Venda).filter(Venda.status == "autorizada")
    
    if data_inicio:
        query = query.filter(func.date(Venda.created_at) >= data_inicio)
    if data_fim:
        query = query.filter(func.date(Venda.created_at) <= data_fim)
    
    vendas = query.all()
    
    total_vendas = sum(venda.total for venda in vendas)
    quantidade_vendas = len(vendas)
    
    return {
        "vendas": vendas,
        "total_vendas": float(total_vendas),
        "quantidade_vendas": quantidade_vendas,
        "ticket_medio": float(total_vendas / quantidade_vendas) if quantidade_vendas > 0 else 0
    }

@router.get("/api/relatorios/produtos-mais-vendidos")
async def produtos_mais_vendidos(limit: int = 10, db: Session = Depends(get_db)):
    resultado = db.query(
        Produto.nome,
        func.sum(ItemVenda.quantidade).label('total_vendido'),
        func.sum(ItemVenda.quantidade * ItemVenda.preco_unitario).label('total_faturado')
    ).join(
        ItemVenda, Produto.id == ItemVenda.produto_id
    ).join(
        Venda, ItemVenda.venda_id == Venda.id
    ).filter(
        Venda.status == "autorizada"
    ).group_by(
        Produto.id, Produto.nome
    ).order_by(
        func.sum(ItemVenda.quantidade).desc()
    ).limit(limit).all()
    
    return [
        {
            "produto": row.nome,
            "quantidade_vendida": row.total_vendido,
            "faturamento": float(row.total_faturado)
        }
        for row in resultado
    ]

@router.get("/api/relatorios/vendas-hoje")
async def vendas_hoje(db: Session = Depends(get_db)):
    hoje = date.today()
    
    vendas = db.query(Venda).filter(
        func.date(Venda.created_at) == hoje,
        Venda.status == "autorizada"
    ).all()
    
    total_hoje = sum(venda.total for venda in vendas)
    quantidade_hoje = len(vendas)
    
    return {
        "data": hoje.strftime('%d/%m/%Y'),
        "total_vendas": float(total_hoje),
        "quantidade_vendas": quantidade_hoje,
        "vendas": vendas
    }

@router.get("/api/relatorios/formas-pagamento")
async def relatorio_formas_pagamento(db: Session = Depends(get_db)):
    resultado = db.query(
        Venda.forma_pagamento,
        func.count(Venda.id).label('quantidade'),
        func.sum(Venda.total).label('total')
    ).filter(
        Venda.status == "autorizada"
    ).group_by(
        Venda.forma_pagamento
    ).all()
    
    return [
        {
            "forma_pagamento": row.forma_pagamento.replace('_', ' ').title(),
            "quantidade": row.quantidade,
            "total": float(row.total)
        }
        for row in resultado
    ]