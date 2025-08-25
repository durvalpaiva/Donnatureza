from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from uuid import uuid4

from app.database import get_db
from app.models.produto import Produto
from app.schemas.produto import ProdutoCreate, ProdutoUpdate, ProdutoResponse

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# Diretório para upload de imagens
UPLOAD_DIR = "app/static/img/produtos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/produtos")
async def tela_produtos(request: Request):
    return templates.TemplateResponse(
        "produtos.html", 
        {"request": request}
    )

@router.get("/api/produtos", response_model=List[ProdutoResponse])
async def listar_produtos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    produtos = db.query(Produto).filter(Produto.ativo == True).offset(skip).limit(limit).all()
    return produtos

@router.get("/api/produtos/{produto_id}", response_model=ProdutoResponse)
async def obter_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

@router.post("/api/produtos", response_model=ProdutoResponse)
async def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    # Verificar se código de barras já existe
    if produto.codigo_barras:
        produto_existente = db.query(Produto).filter(Produto.codigo_barras == produto.codigo_barras).first()
        if produto_existente:
            raise HTTPException(status_code=400, detail="Código de barras já existe")
    
    db_produto = Produto(**produto.dict())
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.put("/api/produtos/{produto_id}", response_model=ProdutoResponse)
async def atualizar_produto(produto_id: int, produto: ProdutoUpdate, db: Session = Depends(get_db)):
    db_produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    update_data = produto.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_produto, field, value)
    
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.delete("/api/produtos/{produto_id}")
async def excluir_produto(produto_id: int, db: Session = Depends(get_db)):
    db_produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Soft delete
    db_produto.ativo = False
    db.commit()
    return {"message": "Produto excluído com sucesso"}

@router.post("/api/produtos/upload-foto/{produto_id}")
async def upload_foto_produto(produto_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload de foto do produto"""
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Validar tipo de arquivo
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")
    
    # Gerar nome único para o arquivo
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Salvar arquivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Remover foto anterior se existir
        if produto.foto_url:
            old_path = os.path.join("app/static", produto.foto_url.lstrip('/static/'))
            if os.path.exists(old_path):
                os.remove(old_path)
        
        # Atualizar URL da foto no banco
        produto.foto_url = f"/static/img/produtos/{unique_filename}"
        db.commit()
        db.refresh(produto)
        
        return {"foto_url": produto.foto_url, "message": "Foto enviada com sucesso"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")

@router.get("/api/produtos/buscar/{termo}")
async def buscar_produtos(termo: str, db: Session = Depends(get_db)):
    produtos = db.query(Produto).filter(
        Produto.ativo == True,
        (Produto.nome.contains(termo) | 
         Produto.codigo_barras.contains(termo) |
         Produto.categoria.contains(termo))
    ).limit(20).all()
    return produtos