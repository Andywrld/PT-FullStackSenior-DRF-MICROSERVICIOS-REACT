# Marketplace: microservicios

Marketplace de e-commerce construido con microservicios independientes en Django
REST Framework, detrás de un gateway nginx:

- **auth**: usuarios, roles y emisión de JWT.
- **products**: catálogo, categorías e imágenes.
- **cart**: el carrito de cada usuario.
- **orders**: órdenes generadas a partir del carrito.

El frontend llega en una fase posterior.

## Requisitos

- Docker y Docker Compose v2 (`docker compose`, no `docker-compose`).

No hace falta un archivo `.env`: todas las variables tienen un valor por defecto
en `docker-compose.yml` (en la raíz del repositorio). Para personalizarlas, copia `env.example` a `.env` en la raíz y
edítalo (ver la nota sobre el nombre al final).

## Uso

Todos los comandos se ejecutan desde la **raíz del repositorio**, donde están `docker-compose.yml` y el `Makefile`.

```sh
make up      # construye, levanta todo el stack y carga el catálogo de ejemplo la primera vez
make test    # corre los tests de todos los servicios (auth, products, cart, orders)
make seed    # vuelve a cargar las 4 categorías y 13 productos de ejemplo
make down    # detiene el stack
make clean   # detiene el stack y borra los volúmenes (se pierden todos los datos)
```

Si no tienes `make` (por ejemplo en Windows), cada comando equivale a su línea
en el `Makefile`; por ejemplo, `make up` es `docker compose up -d`.

Al arrancar se crea automáticamente un **super admin**. Sus credenciales de
desarrollo son `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` en `env.example`;
cámbialas fuera del entorno local.

## URLs (a través del gateway, http://localhost:8080)

| Ruta | Servicio |
|---|---|
| `GET /health` | estado del gateway |
| `/api/v1/auth/...` | registro, login, refresh, logout, perfil, usuarios |
| `/api/v1/products/...` | CRUD del catálogo e imágenes |
| `/api/v1/categories/...` | CRUD de categorías |
| `/api/v1/cart/...` | el carrito del usuario logueado |
| `/api/v1/orders/...` | órdenes generadas desde el carrito |
| `/media/product-images/...` | imágenes públicas de los productos |
| `/api/v1/docs/{auth,products,cart,orders}/` | Swagger UI de cada servicio |

La API está versionada en la URL (`/api/v1/...`) con `URLPathVersioning` de DRF.
Una versión que no existe responde 404.

## Arquitectura

```text
host ─► :8080 gateway (nginx) ─┬─► auth ──────► auth-db        [red auth-data]
                               ├─► products ──► products-db    [red products-data]
                               │      ├───────► redis          [red products-data]
                               │      └───────► minio          [red storage]
                               ├─► cart ──────► cart-db        [red cart-data]
                               │      └─HTTP──► products
                               ├─► orders ────► orders-db      [red orders-data]
                               │      ├─HTTP──► cart (endpoints internos)
                               │      └─HTTP──► products (endpoints internos de stock)
                               └─► /media ────► minio
  products, cart y orders ─JWKS─► auth (clave pública para verificar tokens)
```

- **Una base de datos por servicio**, cada una en su propia red interna: ningún
  servicio (ni el gateway) puede leer la base de otro.
- **El gateway es el único contenedor expuesto** a la máquina (puerto 8080).
- **Cada servicio tiene el mismo patrón en Compose**: `<svc>-db` (Postgres),
  `<svc>-migrate` (corre las migraciones una sola vez y termina), `<svc>` (la API)
  y `<svc>-tests` (solo con `make test`).
- Los servicios se hablan directamente por la red interna (no pasan por el gateway),
  con timeouts cortos, reintentos en operaciones idempotentes y propagación del
  `X-Request-ID`.

## Librería compartida (`libs/common`)

Lo transversal se escribe una sola vez en `marketplace_common` y lo usan todos los
servicios (patrón *microservice chassis*):

- **Formato de respuesta único**: toda respuesta, exitosa o de error, de cualquier
  servicio y del propio nginx, tiene la misma forma:

  ```json
  {"success": true, "data": [...], "error": null,
   "meta": {"request_id": "...", "pagination": {"page": 1, "page_size": 20,
            "total_items": 57, "total_pages": 3, "has_next": true, "has_previous": false}}}

  {"success": false, "data": null, "meta": {"request_id": "..."},
   "error": {"code": "validation_error", "message": "Invalid input.", "details": {"price": ["..."]}}}
  ```

  `error.code` es estable y pensado para que lo lea una máquina (`validation_error`,
  `not_authenticated`, `permission_denied`, `not_found`, `insufficient_stock`,
  `service_unavailable`, ...). Los `DELETE` responden `200` con `data: null` en
  lugar de un `204` vacío, para que el cliente siempre procese la misma forma.
- **Errores**: los casos de uso lanzan subclases de `DomainError` y un único
  manejador de excepciones las convierte (junto con los errores de DRF y Django)
  al formato anterior. Los errores inesperados se registran con su traza completa
  y nunca exponen detalles internos al cliente.
- **Autenticación**: verificación de JWT sin estado y permisos por rol (`IsAdmin`,
  `IsSuperAdmin`, `IsAdminOrReadOnly`). Todo se **niega por defecto**: lo que no
  está marcado explícitamente como público exige un token válido.
- **Request id**: el `X-Request-ID` llega desde el gateway (o se genera), se
  registra en los logs, se devuelve en `meta.request_id` y se reenvía en las
  llamadas entre servicios. Así se puede seguir una request por todos los logs.

Las imágenes de Docker reciben la librería como contexto de build adicional
(`build.additional_contexts: common: ./libs/common`) y la cargan por `PYTHONPATH`.

## Autenticación y roles

- **auth es el único servicio con la clave privada RS256**, generada una sola vez
  en el volumen `auth-keys` por `auth-migrate`. Publica la clave pública en
  `http://auth:8000/.well-known/jwks.json` (solo en la red interna). Los demás
  servicios verifican los tokens con esa clave (la guardan en caché) y **nunca
  pueden fabricar tokens**. Con HS256, un secreto compartido, cualquier servicio
  podría fabricarse un token de admin.
- **Access token**: dura 15 minutos y no se guarda en ningún lado.
  **Refresh token**: dura 7 días, se guarda en la base, **se rota en cada uso** y
  se revoca al hacer logout. Si alguien reutiliza un refresh token ya rotado, se
  asume que fue robado y se revocan todas las sesiones de ese usuario.
- El registro público siempre crea usuarios con rol `user`. Los roles los asigna un
  super admin. Un cambio de rol aplica con el siguiente access token (máximo 15 minutos).
- Un login fallido devuelve el mismo error (`invalid_credentials`) tanto si el email
  no existe como si la contraseña es incorrecta, y nginx limita los endpoints de
  credenciales a 10 requests por minuto por IP.

| Permiso | user | admin | super_admin |
|---|:-:|:-:|:-:|
| Ver productos y categorías (público, sin login) | ✅ | ✅ | ✅ |
| Crear, editar y borrar productos, categorías e imágenes | ❌ | ✅ | ✅ |
| Usar su propio carrito | ✅ | ✅ | ✅ |
| Crear órdenes desde su carrito y ver las propias | ✅ | ✅ | ✅ |
| Ver y filtrar las órdenes de todos los usuarios | ❌ | ✅ | ✅ |
| Listar usuarios, cambiar roles y desactivar cuentas | ❌ | ❌ | ✅ |

```text
POST  /api/v1/auth/register/   {email, password, full_name}
POST  /api/v1/auth/login/      {email, password} -> {access_token, refresh_token, expires_in, user}
POST  /api/v1/auth/refresh/    {refresh_token}   -> par nuevo (el anterior queda revocado)
POST  /api/v1/auth/logout/     {refresh_token}
GET   /api/v1/auth/me/
GET   /api/v1/auth/users/?role=admin            (super_admin)
PATCH /api/v1/auth/users/{id}/ {role, is_active} (super_admin)
```

El access token se envía en el header `Authorization: Bearer <access_token>`.

## Servicio de productos

- Base propia (`products-db`). Precios con `Decimal` (nunca `float`) y
  restricciones en la base: precio mayor o igual a 0 y SKU único.
- El SKU se normaliza (sin espacios, en mayúsculas), así que `abc-1` y `ABC-1` son
  el mismo producto.
- El listado admite paginación, búsqueda (`?search=`), orden (`?ordering=price`) y
  filtros (`?is_active=`, `?in_stock=`, `?min_price=`, `?max_price=`, `?category=<id>`).
- **`?in_stock=true` oculta los productos agotados** (`stock = 0`); `?in_stock=false`
  devuelve solo los agotados. Es opcional y **sin el parámetro el listado los incluye**:
  la tienda lo envía para no ofrecerlos, pero el carrito consulta `?ids=` y necesita
  ver un producto agotado para marcarlo como no disponible, y el panel de
  administración los lista todos. El detalle (`/products/{id}/`) tampoco cambia, así
  que los enlaces desde pedidos o el carrito siguen abriendo y muestran "Agotado".
- **La búsqueda ignora acentos y mayúsculas** (por nombre y SKU; en categorías, por
  nombre): `cafe` encuentra "Café Molido" y `café` encuentra "Cafe". Usa la extensión
  `unaccent` de Postgres, que crea una migración (en Postgres 13+ es una extensión de
  confianza: basta con el permiso `CREATE` sobre la base, sin ser superusuario). La
  búsqueda de usuarios en auth, por nombre completo, funciona igual.
- **La búsqueda de productos también tolera errores de ortografía**: `labadora` o
  `lavdora` encuentran "Lavadora automática Electrolux 12 kg". Solo aplica al nombre
  (el SKU, las categorías y los usuarios siguen siendo búsquedas literales). Usa la
  extensión `pg_trgm` de Postgres, que crea otra migración (también es de confianza en
  Postgres 13+), y compara trigramas con `strict_word_similarity` entre el término y el
  nombre, ambos sin acentos.
  - Un término coincide si aparece en el nombre o el SKU, como antes, **o** si su
    similitud con el nombre llega a **0,45** (`FUZZY_THRESHOLD` en `products/filters.py`).
    El valor sale de calibrar con ejemplos reales: `labadora` puntúa 0,50 y `lavdora`
    0,55 contra "Lavadora", mientras que las palabras vecinas (`licuadora`, `secadora`)
    quedan en 0,36 o menos. El valor por defecto de pg_trgm para `word_similarity`
    (0,6) descartaría esos dos errores. Se usa la variante `strict` porque la normal
    también premia una terminación compartida ("-adora") y deja a "Licuadora" en 0,44,
    demasiado cerca.
  - Los términos de menos de **4 caracteres** (`FUZZY_MIN_TERM_LENGTH`) solo buscan
    literalmente: con tan pocos trigramas no se distingue un error de otra palabra.
  - Se mantiene la semántica de DRF: todos los términos deben coincidir
    (`labadora electrolux` exige ambos) y cada uno puede coincidir por nombre o SKU.
  - **Orden por relevancia**: con `?search=` y sin `?ordering=`, primero van las
    coincidencias literales, luego las aproximadas de mayor a menor similitud y, a
    igualdad, el orden por defecto (`-created_at`), que hace estable la paginación. Un
    `?ordering=` explícito siempre manda. Esto solo afecta a `/products/`
    (`ProductSearchFilter` y `ProductOrderingFilter`, configurados en `ProductViewSet`).
  - **Costo**: no hay índice. La búsqueda ya era un recorrido secuencial (`icontains`)
    y `unaccent` no es `IMMUTABLE`, así que no se puede indexar la expresión tal cual;
    con este catálogo es irrelevante. Si creciera, habría que envolver `unaccent` en una
    función `IMMUTABLE`, crear un índice GIN con `gin_trgm_ops` y consultar con el
    operador `%>>` en lugar de comparar `strict_word_similarity`.
- `?ids=a,b,c` resuelve hasta 100 productos en **una sola llamada**: lo usa el
  carrito para no hacer una request por producto.

### Categorías

- Cada producto puede tener una categoría (opcional, para no invalidar productos
  existentes). El nombre es único sin distinguir mayúsculas, y el `slug` se genera
  solo a partir del nombre.
- **Una categoría con productos no se puede borrar**: responde `409`
  (`category_in_use`). La relación usa `on_delete=PROTECT`, así que ni un borrado
  por fuera de la API deja productos huérfanos.
- Una categoría inactiva sigue asociada a sus productos, pero no se puede asignar
  a productos nuevos.
- El listado incluye `product_count` (útil para el dashboard).

```text
GET    /api/v1/products/                 listado público (filtros arriba)
POST   /api/v1/products/                 crear (admin)          {sku, name, price, stock, category_id, ...}
GET    /api/v1/products/{id}/            detalle público, incluye category e images
PATCH  /api/v1/products/{id}/            editar (admin)
DELETE /api/v1/products/{id}/            borrar (admin)
POST   /api/v1/products/{id}/images/     subir imagen (admin, multipart, campo "image")
DELETE /api/v1/products/{id}/images/{image_id}/

GET    /api/v1/categories/               listado público con product_count
POST   /api/v1/categories/               crear (admin)          {name, description}
GET    /api/v1/categories/{id}/
PATCH  /api/v1/categories/{id}/          editar (admin)         {name, description, is_active}
DELETE /api/v1/categories/{id}/          borrar (admin), 409 si tiene productos
```

### Caché del catálogo (Redis)

El catálogo público (listado y detalle de productos y categorías) se cachea en
Redis. Cada respuesta indica de dónde salió con el header `X-Cache: HIT | MISS | BYPASS`.

- **Invalidación por versión**: todas las claves incluyen `catalog:version`, y
  **cualquier** cambio del catálogo (precio, stock, nombre, estado, categoría o
  imágenes) incrementa esa versión. Todas las combinaciones cacheadas de página,
  filtro y búsqueda quedan inaccesibles de una sola vez, y después expiran por TTL.
  No hace falta saber qué claves afecta cada cambio.
- **Se invalida después del commit** (`transaction.on_commit`): si se invalidara
  antes, una lectura simultánea podría volver a cachear el dato viejo. Una lectura
  lenta que guarda datos viejos lo hace bajo la versión anterior, que ya nadie lee.
- **Lo que no se cachea**: la consulta `?ids=` que usan cart y orders para cobrar
  siempre lee la base (`X-Cache: BYPASS`). El precio al momento de pagar nunca sale
  del caché.
- **Fail-open**: si Redis se cae, el catálogo se sirve desde la base (timeouts de
  200 ms). El caché puede hacer el catálogo más rápido, nunca dejarlo caído.
- **Aislamiento**: Redis vive en la red interna de productos; ningún otro servicio
  puede alcanzarlo. No tiene persistencia y usa un máximo de 64 MB con política LRU.
- **Limitación**: `queryset.update()` y el SQL directo no disparan señales de
  Django; quien los use debe llamar a `catalog_cache.bump_version()`.
- **Compras**: una compra sí invalida el caché, porque descuenta stock. El descuento
  lo hace el servicio de productos con `UPDATE` directos, que no disparan señales de
  Django, así que llama a `catalog_cache.bump_version()` después del commit (una vez
  por descuento, no por producto). Lo mismo al devolver el stock.

### Imágenes (almacenamiento de objetos)

Las imágenes viven en un almacenamiento compatible con S3 (MinIO en local). El
servicio de productos solo habla la API de S3 (`django-storages` + `boto3`), así
que pasar a AWS S3 u otro proveedor compatible es cambiar variables de entorno,
no código.

- **Imagen de Docker**: `pgsty/minio`, un fork de la comunidad. Las imágenes
  oficiales de MinIO se eliminaron de Docker Hub y pasaron a requerir login en Quay
  en septiembre de 2026. Está fijada por digest porque es una imagen de terceros.
- **Inicialización**: el contenedor `minio-init` (`storage/init.sh`) crea el bucket
  `product-images`, permite la lectura anónima de objetos individuales (sin poder
  listar el bucket) y crea un usuario con permisos mínimos para el servicio de
  productos. Es idempotente.
- **Lectura pública**: `GET /media/product-images/<key>` a través del gateway. Se
  cachea como `immutable` porque cada archivo tiene un nombre aleatorio que nunca se
  sobrescribe. Los métodos de escritura, el listado del bucket y las claves
  inexistentes responden 404 en JSON.
- **Consola**: http://127.0.0.1:9001 (solo desde la máquina local), con
  `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` (valores de desarrollo en `env.example`).
- **Reglas**: JPEG, PNG o WEBP, detectado por el contenido del archivo y no por la
  extensión; máximo 5 MB; hasta 8 imágenes por producto; solo admin. El archivo se
  borra del almacenamiento recién cuando se confirma el borrado en la base.

### Endpoints internos de stock (para órdenes)

Igual que los internos del carrito (más abajo), existen solo para otros servicios: no
piden token, nginx no los expone y la confianza se basa en el aislamiento de red.

```text
POST   /internal/v1/stock/deductions/              {reference, items: [{product_id, quantity}]}
DELETE /internal/v1/stock/deductions/{reference}/  devuelve el stock de ese descuento
```

- **Idempotentes por `reference`** (el id de la orden), que se guarda en
  `StockDeduction` con restricción única. `POST` responde `201` cuando descuenta y
  `200` cuando esa referencia ya estaba descontada (un reintento no descuenta dos
  veces). `DELETE` devuelve el stock una sola vez; si la referencia no existe o ya
  se devolvió, no hace nada, y responde `200` con `data: null` como todos los `DELETE`.
- **Todo o nada**: cada producto debe existir, estar activo y tener stock suficiente.
  Si no, responde `409` sin descontar nada: `insufficient_stock` o `unavailable_items`,
  con todos los productos con problema en `error.details.products`. Repetir el `POST`
  de una referencia ya devuelta responde `409` (`stock_deduction_released`) en lugar de
  aparentar que el stock sigue retenido.
- **Concurrencia**: la fila de la referencia se inserta primero (el índice único hace
  esperar a una llamada idéntica y simultánea, que después recibe el `200`) y luego se
  bloquean los productos con `SELECT ... FOR UPDATE` ordenados por id, así que dos
  órdenes por la última unidad no pasan las dos y no hay deadlocks.

## Servicio de carrito

- **Un carrito por usuario** (`Cart.user_id` es único y sale del JWT). No hay id de
  carrito en la URL, así que nadie puede ver el carrito de otro adivinando un id.
- Base propia (`cart-db`). `CartItem.product_id` es un UUID simple y no una clave
  foránea, porque el producto vive en la base de otro servicio.
- **El carrito no guarda precios**: en cada lectura consulta los precios actuales a
  productos en una sola llamada (`?ids=`). La orden es la que congela el precio.
- Si productos no responde, el carrito devuelve `503` con `Retry-After`, y su
  healthcheck ignora a productos a propósito (una caída de productos no debe
  reiniciar el carrito).
- **Arquitectura hexagonal liviana**: los casos de uso (`carts/services.py`)
  dependen del puerto `ProductCatalog` (`carts/catalog.py`); el adaptador HTTP está
  en `carts/catalog_http.py` y los tests usan una versión en memoria.

```text
GET    /api/v1/cart/                        ítems + total por línea + subtotal
POST   /api/v1/cart/items/                  {product_id, quantity} (suma si ya existe)
PATCH  /api/v1/cart/items/{product_id}/     {quantity}
DELETE /api/v1/cart/items/{product_id}/     quitar un ítem
DELETE /api/v1/cart/items/                  vaciar el carrito
```

### Endpoints internos del carrito (para órdenes)

`GET /internal/v1/carts/<user_id>/` y `DELETE /internal/v1/carts/<user_id>/items/`
existen solo para otros servicios, nunca para el navegador. No piden token, se
identifican por `user_id` y nginx no los expone, así que solo son alcanzables desde
la red interna de Docker. **Contra a tener en cuenta**: la confianza se basa solo en
el aislamiento de red; en producción se agregaría mTLS o credenciales por servicio,
porque "no pasa por el gateway" no es lo mismo que "quien llama está autenticado".

## Servicio de órdenes

- La orden se genera desde el carrito de quien la pide: `POST /api/v1/orders/` no
  lleva body. El servicio pide ese carrito a cart (por `user_id`, con los
  endpoints internos), lo valida y crea la orden en una sola transacción.
- **Precios congelados**: `OrderItem.product_name` y `unit_price` se copian del
  carrito al momento de la compra y nunca cambian, aunque después el producto se
  renombre, cambie de precio o se borre. `Order.customer_email` también se copia
  del token, para que el dashboard muestre al comprador sin consultar a auth.
- **Validación sin datos a medias**: un carrito vacío (`empty_cart`), con productos
  no disponibles (`unavailable_items`) o con cantidades mayores al stock
  (`insufficient_stock`) se rechaza con 400 antes de escribir nada. Si el carrito
  no responde, se devuelve `503` y no se crea nada.
- **Idempotency-Key**: el header opcional `Idempotency-Key` (máximo 64 caracteres)
  se guarda en la orden. Repetir la misma clave devuelve la orden original (`200`
  en lugar de `201`) en vez de crear un duplicado: protege del doble clic y de los
  reintentos. Si dos requests llegan al mismo tiempo, lo resuelve la restricción
  única de la base sobre `(user_id, idempotency_key)`.
- **El carrito se vacía después del commit, sin bloquear la orden**: primero se
  confirma la orden y después se intenta vaciar el carrito; el resultado se informa
  en `meta.cart_cleared`. Si en ese momento el carrito no responde, la orden **no**
  se deshace: perder una orden válida es peor que dejar un carrito sin vaciar. En
  producción el vaciado se reintentaría de forma asíncrona (tabla outbox o un job).
- **El stock se descuenta al generar la orden**: tras validar el carrito, orders le
  pide a productos que descuente todas las líneas (ver "Endpoints internos de stock"),
  usando el id de la orden como referencia. Si en ese momento otra compra se llevó el
  stock, productos lo rechaza y la respuesta es la misma (`insufficient_stock`, 400), sin
  orden y con el carrito intacto. La llamada se hace **fuera de cualquier transacción**:
  nunca se mantiene un lock de la base mientras se espera a otro servicio. Como es
  idempotente por referencia, reintentarla (timeouts, reintentos de la sesión HTTP) es seguro.
- **Si la orden no llega a crearse, el stock se devuelve**: si productos no responde
  (`503`; pudo haber aplicado el descuento igual), si falla el insert de la orden o si
  se pierde la carrera de la `Idempotency-Key`, orders llama al `DELETE` de esa
  referencia. Es *best effort*: si la devolución también falla, el stock queda retenido
  hasta que alguien lo reconcilie, igual que si el proceso muere entre el descuento y la
  orden. En producción un job barrería los descuentos sin orden (saga u outbox). Un
  reintento idempotente devuelve la orden original antes de descontar nada.
- **Quién ve qué**: un usuario solo ve sus propias órdenes; si pide la orden de otro
  recibe `404` (no `403`), para no confirmar siquiera que existe. Los admins ven
  todas y pueden filtrar con `?user_id=` y `?status=`.
- Misma arquitectura hexagonal liviana que el carrito: el caso de uso
  (`orders/services.py`) depende de los puertos `CartGateway` (`orders/cart_gateway.py`)
  y `StockGateway` (`orders/stock_gateway.py`), los adaptadores HTTP están en
  `orders/cart_http.py` y `orders/stock_http.py`, y los tests usan versiones en memoria.

```text
GET  /api/v1/orders/          órdenes propias (admin: todas, ?user_id=, ?status=)
GET  /api/v1/orders/{id}/     una orden propia (admin: cualquiera)
POST /api/v1/orders/          crea una orden desde el carrito
                              header opcional: Idempotency-Key (máximo 64 caracteres)
```

## Notas

- **Datos de demo**: el contenedor `products-seed` carga 4 categorías y 13 productos con
  las fotos de `services/products/seed_data/images/` en el primer arranque (`--if-empty`:
  si ya hay productos, no hace nada, para no pisar lo editado desde el admin). `make seed`
  los vuelve a cargar a pedido. Es un comando y no una migración a propósito: las
  migraciones corren en todos los entornos y los datos de demo no deberían. Algunas fotos tienen marca de agua de bancos de imágenes: sirven
  para probar en local, pero deben reemplazarse por imágenes con licencia libre antes
  de publicar el proyecto.

- El entorno donde se generó este repositorio no permite crear archivos que empiecen
  con `.env`, por eso la plantilla se llama `env.example` en lugar de `.env.example`.
  Funciona igual: cópiala a `.env`.
