# VMDocs Frontend

Interfaz web de la plataforma VMDocs, un sistema de gestion documental orientado a estudios juridicos. Consume la API REST del backend para administrar clientes, casos, documentos, usuarios y actividades.

## Tecnologias

- React 19
- Vite 8
- React Router DOM 7
- Axios
- React Hook Form
- React Toastify
- Tailwind CSS 3
- ESLint

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- El backend de VMDocs disponible (local o en produccion)

## Instalacion

1. Clonar el repositorio:

```
git clone <url-del-repositorio>
cd vmdocs-frontend
```

2. Instalar dependencias:

```
npm install
```

3. Configurar las variables de entorno (ver seccion siguiente).

## Variables de entorno

Crear un archivo `.env` en la raiz del proyecto:

```
VITE_API_URL=http://127.0.0.1:8000
```

Para apuntar al backend en produccion, reemplazar el valor con la URL del servidor desplegado. Todas las variables deben comenzar con el prefijo `VITE_` para que Vite las exponga al codigo del cliente.

## Ejecutar en desarrollo

```
npm run dev
```

La aplicacion queda disponible en `http://localhost:5173`.

## Construir para produccion

```
npm run build
```

Los archivos estaticos se generan en la carpeta `dist/`. El archivo `vercel.json` incluido configura las redirecciones necesarias para que el enrutamiento del lado del cliente funcione correctamente al desplegarse en Vercel.

## Estructura del proyecto

```
vmdocs-frontend/
├── public/                  # Archivos estaticos publicos
├── src/
│   ├── assets/              # Imagenes y recursos
│   ├── components/          # Componentes reutilizables
│   │   ├── auth/            # Componentes de autenticacion (PrivateRoute)
│   │   ├── documentos/      # Componentes del modulo de documentos
│   │   ├── ui/              # Componentes de interfaz genericos
│   │   └── usuarios/        # Componentes del modulo de usuarios
│   ├── hooks/               # Hooks personalizados (useAuth, useDocumentos, useIA, useUsuarios)
│   ├── layouts/             # Layouts de pagina (DashboardLayout)
│   ├── pages/               # Vistas principales de la aplicacion
│   ├── services/            # Funciones de llamada a la API (Axios)
│   ├── styles/              # Estilos globales adicionales
│   ├── utils/               # Funciones auxiliares
│   ├── App.jsx              # Definicion de rutas
│   ├── main.jsx             # Punto de entrada
│   └── index.css            # Estilos base
├── .env                     # No incluido en el repositorio
├── vercel.json              # Configuracion de despliegue en Vercel
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Paginas de la aplicacion

| Ruta                  | Descripcion                                          | Acceso       |
|-----------------------|------------------------------------------------------|--------------|
| `/login`              | Inicio de sesion                                     | Publico      |
| `/forgot-password`    | Solicitud de recuperacion de contrasena              | Publico      |
| `/reset-password`     | Formulario para establecer nueva contrasena          | Publico      |
| `/dashboard`          | Metricas y resumen general                           | Autenticado  |
| `/casos`              | Listado de casos                                     | Autenticado  |
| `/casos/:id`          | Detalle de un caso                                   | Autenticado  |
| `/clientes`           | Listado de clientes                                  | Autenticado  |
| `/clientes/:id`       | Detalle de un cliente                                | Autenticado  |
| `/usuarios`           | Gestion de usuarios (solo administradores)           | Autenticado  |
| `/documentos`         | Gestion de documentos                                | Autenticado  |

Las rutas autenticadas estan protegidas por el componente `PrivateRoute`, que verifica la presencia de un token JWT valido antes de renderizar la pagina. Si el token no existe o expiro, redirige automaticamente a `/login`.

## Autenticacion

El token JWT se obtiene al iniciar sesion y se almacena en `localStorage`. Axios lo incluye automaticamente en el encabezado `Authorization` de cada peticion al backend mediante un interceptor configurado en `src/services/api.js`.

## Despliegue

El proyecto esta configurado para desplegarse en Vercel. El archivo `vercel.json` define una regla de reescritura que redirige todas las rutas a `index.html`, lo que es necesario para que React Router funcione correctamente con navegacion directa o recarga de pagina.

Para desplegar manualmente:

```
npm run build
```

Luego subir el contenido de `dist/` a cualquier servicio de hosting estatico compatible con SPA.

## Contribucion

1. Crear una rama a partir de `main` con un nombre descriptivo.
2. Hacer los cambios y verificar que la aplicacion compile sin errores (`npm run build`) y pase el linter (`npm run lint`).
3. Abrir un pull request describiendo los cambios realizados.

No se deben commitear archivos `.env` ni informacion sensible. El archivo `.gitignore` ya esta configurado para excluirlos.
