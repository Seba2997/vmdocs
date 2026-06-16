# VMDocs

Integrantes:
- Sebastian Valdebenito
- Fabian Morales

Sistema de gestión documental orientado a estudios jurídicos. Permite administrar clientes, casos, documentos y usuarios, con soporte para análisis de documentos mediante IA.



## Estructura del repositorio

```
vmdocs/
├── backend/    ← API REST (Python · FastAPI · PostgreSQL/Supabase)
└── frontend/   ← Aplicación web (React · Vite · Tailwind CSS)
```

## Tecnologías

| Capa       | Stack                                              |
|------------|----------------------------------------------------|
| Backend    | Python 3.11+, FastAPI, SQLAlchemy 2.0, Supabase    |
| Frontend   | React 19, Vite 8, React Router DOM 7, Tailwind CSS |
| IA         | Groq API (LLaMA 3.3-70b)                           |
| Base datos | PostgreSQL (Supabase)                              |
| Despliegue | Render (backend) · Vercel (frontend)               |

## Inicio rápido

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS
pip install -r requirements.txt
cp .env.example .env         # Completar con tus credenciales
uvicorn app.main:app --reload
```

El servidor queda disponible en `http://localhost:8000`.  
Documentación interactiva (Swagger): `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env         # Ajustar VITE_API_URL si es necesario
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Variables de entorno

Cada subproyecto incluye un archivo `.env.example` con todas las variables necesarias y descripciones.  
Nunca se deben commitear archivos `.env` con credenciales reales.

## Documentación detallada

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## Contribución

1. Crear una rama a partir de `main` con un nombre descriptivo.
2. Realizar los cambios en el subproyecto correspondiente (`backend/` o `frontend/`).
3. Verificar que el backend inicie y el frontend compile sin errores.
4. Abrir un pull request describiendo los cambios realizados.
