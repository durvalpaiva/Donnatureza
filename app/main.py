from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.config import settings
from app.database import Base, engine, get_db
from app.routers import produtos, vendas, relatorios, estoque

# Criar tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema Donnatureza",
    description="Sistema de vendas com NFC-e para Donnatureza",
    version="1.0.0",
    debug=settings.debug
)

# Static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

# Routers
app.include_router(produtos.router)
app.include_router(vendas.router)
app.include_router(relatorios.router)
app.include_router(estoque.router)

@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "config": settings}
    )

@app.get("/catalogo")
async def catalogo(request: Request):
    return templates.TemplateResponse(
        "catalogo.html",
        {"request": request}
    )

@app.get("/inventario")
async def inventario(request: Request):
    return templates.TemplateResponse(
        "inventario.html",
        {"request": request}
    )

@app.get("/api/simple-produtos")
async def listar_produtos_simple(db: Session = Depends(get_db)):
    from app.models.produto import Produto
    produtos = db.query(Produto).filter(Produto.ativo == True).all()
    return [
        {
            "id": p.id,
            "nome": p.nome,
            "codigo_barras": p.codigo_barras,
            "preco": float(p.preco),
            "estoque": p.estoque,
            "categoria": p.categoria,
            "ativo": p.ativo
        }
        for p in produtos
    ]

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Sistema Donnatureza funcionando!"}