from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from app.database import get_db
from app.models.venda import Venda, ItemVenda
from app.models.produto import Produto
from app.schemas.venda import VendaCreate, VendaResponse
from app.services.estoque_service import EstoqueService

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/vendas")
async def tela_vendas(request: Request):
    return templates.TemplateResponse(
        "vendas.html", 
        {"request": request}
    )

@router.post("/api/vendas", response_model=VendaResponse)
async def criar_venda(venda: VendaCreate, db: Session = Depends(get_db)):
    try:
        # Calcular total
        total = Decimal("0.00")
        itens_venda = []
        
        for item in venda.itens:
            # Verificar se produto existe
            produto = db.query(Produto).filter(Produto.id == item.produto_id).first()
            if not produto:
                raise HTTPException(status_code=404, detail=f"Produto {item.produto_id} não encontrado")
            
            # Verificar estoque
            if produto.estoque < item.quantidade:
                raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {produto.nome}")
            
            subtotal = item.quantidade * item.preco_unitario
            total += subtotal
            
            itens_venda.append({
                "produto_id": item.produto_id,
                "quantidade": item.quantidade,
                "preco_unitario": item.preco_unitario
            })
        
        # Aplicar desconto
        total -= venda.desconto
        
        # Criar venda
        db_venda = Venda(
            total=total,
            desconto=venda.desconto,
            cpf_cliente=venda.cpf_cliente,
            forma_pagamento=venda.forma_pagamento
        )
        db.add(db_venda)
        db.flush()  # Para obter o ID da venda
        
        # Criar itens da venda
        for item_data in itens_venda:
            db_item = ItemVenda(
                venda_id=db_venda.id,
                **item_data
            )
            db.add(db_item)
        
        db.commit()
        db.refresh(db_venda)
        
        # Processar movimentação de estoque
        estoque_service = EstoqueService(db)
        estoque_service.processar_venda(db_venda)
        
        return db_venda
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/vendas", response_model=List[VendaResponse])
async def listar_vendas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    vendas = db.query(Venda).offset(skip).limit(limit).all()
    return vendas

@router.get("/api/vendas/{venda_id}", response_model=VendaResponse)
async def obter_venda(venda_id: int, db: Session = Depends(get_db)):
    venda = db.query(Venda).filter(Venda.id == venda_id).first()
    if venda is None:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda

@router.get("/api/vendas/{venda_id}/cupom")
async def gerar_cupom(venda_id: int, db: Session = Depends(get_db)):
    venda = db.query(Venda).filter(Venda.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    
    # HTML do cupom para impressão
    cupom_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: monospace; width: 58mm; margin: 0; padding: 5px; }}
            .center {{ text-align: center; }}
            .linha {{ border-bottom: 1px dashed #000; margin: 5px 0; }}
            .total {{ font-weight: bold; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="center">
            <h3>DONNATUREZA</h3>
            <p>Av Senador Dinarte Mariz, 4077 Lj 01</p>
            <div class="linha"></div>
        </div>
        <p>Venda: #{venda.id}</p>
        <p>Data: {venda.created_at.strftime('%d/%m/%Y %H:%M')}</p>
        <div class="linha"></div>
        <table width="100%">
    """
    
    for item in venda.itens:
        cupom_html += f"""
            <tr>
                <td>{item.produto.nome[:20]}</td>
                <td>{item.quantidade}x</td>
                <td>R$ {item.preco_unitario:.2f}</td>
            </tr>
        """
    
    cupom_html += f"""
        </table>
        <div class="linha"></div>
        <p class="total">TOTAL: R$ {venda.total:.2f}</p>
        <p>Pagamento: {venda.forma_pagamento.replace('_', ' ').title()}</p>
        <div class="center">
            <p>Obrigado pela preferência!</p>
        </div>
    </body>
    </html>
    """
    
    return {"cupom_html": cupom_html}