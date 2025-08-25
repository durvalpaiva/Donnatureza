import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./donnatureza.db")
    
    # FastAPI
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"
    secret_key: str = os.getenv("SECRET_KEY", "seu-secret-key-super-seguro-donnatureza")
    
    # Railway specific
    port: int = int(os.getenv("PORT", 8000))
    
    # NFC-e
    sefaz_ambiente: str = os.getenv("SEFAZ_AMBIENTE", "homologacao")
    certificado_path: str = os.getenv("CERTIFICADO_PATH", "certificados/certificado.pfx")
    certificado_senha: str = os.getenv("CERTIFICADO_SENHA", "")
    csc_id: str = os.getenv("CSC_ID", "1")
    csc_token: str = os.getenv("CSC_TOKEN", "")
    
    # Loja
    loja_nome: str = os.getenv("LOJA_NOME", "Donnatureza")
    loja_cnpj: str = os.getenv("LOJA_CNPJ", "00.000.000/0001-00")
    loja_ie: str = os.getenv("LOJA_IE", "000000000")
    loja_endereco: str = os.getenv("LOJA_ENDERECO", "[Endereço da loja]")
    
    class Config:
        env_file = ".env"

settings = Settings()