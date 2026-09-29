# Marketplace

Marketplace de e-commerce construido con microservicios independientes (Django REST
Framework) detrás de un gateway nginx. La SPA en React se agrega en una fase posterior.

## Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| `backend/` | Gateway nginx, microservicios (auth, products, cart, orders), librería compartida y stack de Docker Compose |

## Inicio rápido

```sh
cd backend
make up
make seed
```

La API queda disponible en http://localhost:8080. El detalle de la arquitectura, las
decisiones de diseño y todos los endpoints está en [`backend/README.md`](backend/README.md).
