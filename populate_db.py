#!/usr/bin/env python3
"""
Script para popular o banco de dados em produção com dados iniciais
Execute após o primeiro deploy no Railway
"""

import sys
import os

# Adicionar o diretório do projeto ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Produto

def create_initial_products():
    """Criar produtos iniciais para demonstração"""
    db = SessionLocal()
    
    # Verificar se já existem produtos
    existing_products = db.query(Produto).count()
    if existing_products > 0:
        print(f"✅ Banco já contém {existing_products} produtos. Não é necessário popular.")
        db.close()
        return
    
    print("🌱 Criando produtos iniciais...")
    
    produtos_exemplo = [
        {
            'nome': 'Sabonete Natural Lavanda',
            'codigo_barras': '1234567890123',
            'preco': 15.90,
            'estoque': 25,
            'estoque_minimo': 5,
            'estoque_maximo': 50,
            'estoque_inicial': 25,
            'categoria': 'Sabonetes',
            'descricao': 'Sabonete artesanal com lavanda natural, hidratante e aromático'
        },
        {
            'nome': 'Óleo Essencial Eucalipto',
            'codigo_barras': '2345678901234',
            'preco': 35.00,
            'estoque': 15,
            'estoque_minimo': 10,
            'estoque_maximo': 30,
            'estoque_inicial': 15,
            'categoria': 'Óleos',
            'descricao': 'Óleo essencial puro de eucalipto, ideal para aromaterapia'
        },
        {
            'nome': 'Chá Verde Orgânico',
            'codigo_barras': '3456789012345',
            'preco': 12.50,
            'estoque': 40,
            'estoque_minimo': 8,
            'estoque_maximo': 60,
            'estoque_inicial': 40,
            'categoria': 'Chás',
            'descricao': 'Chá verde orgânico certificado, rico em antioxidantes'
        },
        {
            'nome': 'Shampoo Natural Aloe Vera',
            'codigo_barras': '4567890123456',
            'preco': 28.90,
            'estoque': 20,
            'estoque_minimo': 12,
            'estoque_maximo': 35,
            'estoque_inicial': 20,
            'categoria': 'Cosméticos',
            'descricao': 'Shampoo natural com aloe vera, sem sulfatos e parabenos'
        },
        {
            'nome': 'Mel Puro Silvestre',
            'codigo_barras': '5678901234567',
            'preco': 22.00,
            'estoque': 30,
            'estoque_minimo': 15,
            'estoque_maximo': 60,
            'estoque_inicial': 30,
            'categoria': 'Alimentos',
            'descricao': 'Mel puro extraído de flores silvestres, sem aditivos'
        },
        {
            'nome': 'Creme Facial Natural',
            'codigo_barras': '6789012345678',
            'preco': 45.00,
            'estoque': 18,
            'estoque_minimo': 8,
            'estoque_maximo': 25,
            'estoque_inicial': 18,
            'categoria': 'Cosméticos',
            'descricao': 'Creme facial com ingredientes naturais para todos os tipos de pele'
        },
        {
            'nome': 'Óleo de Coco Extravirgem',
            'codigo_barras': '7890123456789',
            'preco': 18.50,
            'estoque': 35,
            'estoque_minimo': 20,
            'estoque_maximo': 50,
            'estoque_inicial': 35,
            'categoria': 'Óleos',
            'descricao': 'Óleo de coco puro, prensado a frio, multiuso'
        },
        {
            'nome': 'Chá de Camomila',
            'codigo_barras': '8901234567890',
            'preco': 8.90,
            'estoque': 45,
            'estoque_minimo': 15,
            'estoque_maximo': 70,
            'estoque_inicial': 45,
            'categoria': 'Chás',
            'descricao': 'Chá de camomila natural, calmante e relaxante'
        }
    ]
    
    try:
        for produto_data in produtos_exemplo:
            produto = Produto(**produto_data)
            db.add(produto)
        
        db.commit()
        
        print(f"✅ {len(produtos_exemplo)} produtos criados com sucesso!")
        print("\n📦 Produtos adicionados:")
        for produto_data in produtos_exemplo:
            print(f"   • {produto_data['nome']} - R$ {produto_data['preco']:.2f} (Estoque: {produto_data['estoque']})")
        
        print(f"\n🎯 Resumo:")
        print(f"   • Total de produtos: {len(produtos_exemplo)}")
        print(f"   • Valor total do estoque: R$ {sum(p['preco'] * p['estoque'] for p in produtos_exemplo):.2f}")
        print(f"   • Produtos com estoque baixo: {sum(1 for p in produtos_exemplo if p['estoque'] <= p['estoque_minimo'])}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao criar produtos: {str(e)}")
        raise
    finally:
        db.close()

def main():
    print("🚀 Populando banco de dados do Sistema Donnatureza")
    print("=" * 50)
    
    try:
        create_initial_products()
        print("\n✅ Banco de dados populado com sucesso!")
        print("🌐 Acesse o sistema em: https://www.donnatureza.com.br")
        
    except Exception as e:
        print(f"\n❌ Erro durante a população do banco: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()