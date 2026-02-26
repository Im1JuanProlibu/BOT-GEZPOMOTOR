# 🚗 Prolibu Automotive Chatbot

Sistema de cotización automotriz embebible en cualquier plataforma web. Carga dinámicamente desde GitHub sin necesidad de modificar el editor de la plataforma en cada actualización.

---

## 📁 Estructura del repositorio

```
/
├── voyah-bot.html     →  Código fuente del bot (HTML + CSS + JS)
└── loader.js          →  Script intermediario que carga el bot en la plataforma
```

> El nombre `voyah-bot.html` puede variar según el cliente. Lo importante es que `loader.js` apunte al archivo correcto.

---

## ⚙️ Cómo funciona el sistema

```
Plataforma (editor)
    └── 2 líneas de código fijas
            └── carga loader.js desde GitHub Pages
                    └── hace fetch a {cliente}-bot.html desde raw.githubusercontent.com
                            └── inyecta HTML + carga scripts en orden secuencial
                                    └── inicializa el formulario y consulta APIs de Prolibu
```

### ¿Por qué este enfoque?

Los editores de plataformas como Prolibu ejecutan y guardan el resultado del código HTML/JS cuando detectan scripts. Si se pega el bot directamente, el editor renderiza el formulario y guarda el HTML estático, perdiendo el código fuente.

La solución es que el editor solo vea una etiqueta `<script src>` estática apuntando a GitHub Pages — algo que no puede ejecutar ni renderizar.

---

## 🖥️ Lo que va en el editor de la plataforma

Configurar **una sola vez**. Nunca más se toca.

```html
<div id="bot-{cliente}">Cargando...</div>
<script src="https://{usuario}.github.io/{repo}/loader.js"></script>
```

**Pasos:**
1. Abrir el editor HTML del bot
2. Cambiar a vista código `< >`
3. `Ctrl + A` → borrar todo
4. Pegar las 2 líneas
5. Dar OK **sin** cambiar a vista visual

---

## 🔄 loader.js — Funcionamiento detallado

```js
(function () {
  var URL = 'https://raw.githubusercontent.com/{usuario}/{repo}/main/{cliente}-bot.html?t=' + Date.now();
  // ...
})();
```

### Pasos internos del loader

| Paso | Qué hace |
|------|----------|
| 1 | Hace `fetch` al HTML del bot con `?t=Date.now()` para forzar descarga fresca |
| 2 | Parsea el HTML en un `div` temporal |
| 3 | Extrae todos los `<script src>` externos y el código JS inline por separado |
| 4 | Inyecta el HTML del formulario en `#bot-{cliente}` |
| 5 | Carga los scripts externos **en orden secuencial** (uno espera al anterior) |
| 6 | Ejecuta el código JS inline una vez que todos los scripts están listos |

### ¿Por qué carga secuencial y no paralela?

Si los scripts se cargan en paralelo, el código del bot se ejecuta antes de que jQuery, Nodriza SDK o Select2 estén disponibles, causando errores como `jQuery is not defined` o `Nodriza is not defined`. La carga secuencial garantiza el orden correcto de dependencias.

### Función `loadInOrder`

```js
function loadInOrder(srcs, callback) {
  if (!srcs.length) return callback();
  loadScript(srcs[0], function () {
    loadInOrder(srcs.slice(1), callback);
  });
}
```

Carga recursivamente: espera a que el primero termine antes de cargar el siguiente. Cuando la lista está vacía, ejecuta el callback (el código inline del bot).

---

## 📦 Dependencias del bot

Los siguientes scripts se cargan en este orden dentro del HTML del bot:

| Librería | URL | Para qué se usa |
|----------|-----|-----------------|
| jQuery 2.2.2 | ajax.googleapis.com | DOM, AJAX, eventos |
| Nodriza SDK | cdn.nodriza.io | APIs de Prolibu (agentes, productos, propuestas) |
| Lodash 4.17 | cdnjs.cloudflare.com | Utilidades JS (validación de respuestas) |
| Select2 4.1 | cdn.jsdelivr.net | Dropdowns mejorados |
| intl-tel-input 17 | cdnjs.cloudflare.com | Selector de código de país |

> **Importante:** el orden importa. jQuery debe cargarse antes que Nodriza SDK. Lodash antes que la lógica del bot.

---

## 🔌 APIs de Prolibu utilizadas

### `GET /v1/publicservices/getAgents`

Carga la lista de asesores activos.

```js
fetchData(`https://${domain}/v1/publicservices/getAgents`, "GET",
  { status: 'active', roles: ['agent'] }, {},
  function(data) { /* filtrar por departamento */ }
);
```

**Filtro aplicado:** se filtran los agentes cuyo campo `department` coincida con `departmentFilter`.

**Campos que usa el bot del objeto agente:**

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `email` | ✅ Sí | Identificador único del asesor. Se usa para asignar el lead. |
| `firstName` / `firstname` | ✅ Sí | Nombre del asesor (acepta ambas variantes de capitalización) |
| `lastName` / `lastname` | ✅ Sí | Apellido del asesor |
| `department` | ✅ Sí | Departamento al que pertenece. Se filtra contra `departmentFilter`. |
| `city` | Depende | Se usa como nombre de **vitrina**. Si no existe, el asesor no tendrá vitrina asignada. |
| `metadata.ciudad` | Depende | Se usa como **ciudad** del asesor. Si no existe, el campo `ciudad` queda vacío y el asesor no aparecerá en ninguna ciudad. |

> ⚠️ La estructura del objeto agente puede variar según la configuración del cliente en Prolibu. Si los campos de ciudad o vitrina vienen en otros campos (por ejemplo directamente en `city` sin metadata), se debe ajustar la función `loadAgents()` para mapear correctamente los campos.

**Ejemplo de mapeo en `loadAgents()`:**
```js
agentsList = voyahAgents.map(a => ({
  email:     a.email,
  firstName: a.firstName || a.firstname || '',
  lastName:  a.lastName  || a.lastname  || '',
  department: a.department || '',
  ciudad:    a.metadata?.ciudad || a.ciudad || '',   // ajustar según el cliente
  vitrina:   a.city || a.vitrina || ''               // ajustar según el cliente
}));
```

---

### `GET /v1/product`

Carga la lista de productos/vehículos.

```js
fetchData(`https://${domain}/v1/product`, "GET",
  { limit: 1000 },
  { Authorization: `Bearer ${bearerToken}` },
  function(response) { /* filtrar por pricingList */ }
);
```

**Filtro aplicado:** se muestran solo los productos cuya `pricingList` contenga el valor de `pricingListFilter`.

**Estructura esperada por producto:**
```json
{
  "sku": "VOY-001",
  "name": "Voyah Free",
  "disabled": false,
  "pricingList": { "name": "Voyah" }
}
```

---

### `GET /v1/ConfirmationCode/`

Genera el captcha numérico. Se carga como un `<embed>` en el formulario.

```js
$('#confirmation-container').append(
  '<embed src="https://' + domain + '/v1/ConfirmationCode/?color=white&noise=2&size=4">'
);
```

**Parámetros:**
| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `color` | `white` / `black` | Color del texto del código |
| `noise` | `1-5` | Nivel de ruido visual |
| `size` | `1-6` | Tamaño del código |

---

### `nodriza.api.confirmationCode.confirm({ code })`

Valida el código ingresado por el usuario.

```js
nodriza.api.confirmationCode.confirm({ code }, function(err, results) {
  if (!_.isEmpty(err)) {
    // código inválido → recargar
    window.location.reload();
    return;
  }
  if (results && results.hash) {
    json.hash = results.hash;
    createProposal(json);
  }
});
```

Si es válido, devuelve un `hash` que se debe incluir en la generación de la propuesta.

---

### `nodriza.api.proposalbot.generate(options)`

Genera la propuesta comercial y registra el lead.

```js
nodriza.api.proposalbot.generate({
  chatbot: botName,
  to: {
    firstName, lastName, mobile, email,
    agent: assignedAgentEmail
  },
  doc: {
    title: 'Cotización Nombre - Modelo',
    products: [{ id: sku, quantity: 1 }],
    status: 'Ready',
    currency: 'COP',
    metadata: {
      webhook: true,              // activa webhook HubSpot
      pipeline: pipelineId,
      dealstage: dealstageId,
      customNameDealHubspot: 'Nombre - Modelo',
      agentEmail: assignedAgentEmail,
      deal_currency_code: 'COP',
      customAttributes: [...]
    },
    dic: { hash }                 // hash del captcha validado
  },
  emailClient: true,
  emailAgent: true,
  assignedAgentEmail
}, function(err, res) {
  // res.url → URL de la propuesta generada
  window.location = `https://api.whatsapp.com/send?phone=${mobile}&text=...${res.url}`;
});
```

---

## 🧠 Funciones principales del bot

### `loadAgents()`
Consulta la API de agentes, filtra por `departmentFilter` y construye el array `agentsList` con estructura normalizada (email, nombre, ciudad, vitrina).

### `loadProducts()`
Consulta la API de productos con el Bearer Token, filtra por `pricingListFilter` y puebla el `<select#model>` con Select2.

### `onCiudadChange()`
Se ejecuta cuando el usuario cambia la ciudad. Filtra `agentsList` por ciudad, extrae las vitrinas únicas disponibles y muestra el `<select#vitrina>` dinámicamente.

### `getNextAgent()`
Selecciona el asesor a asignar usando **balanceo round-robin** — filtra los agentes por ciudad y vitrina seleccionada, y rota entre ellos usando `currentAgentIndex % filtered.length`.

### `getSelectedProducts()`
Filtra `productsList` para retornar solo los productos activos que coincidan con `pricingListFilter` (búsqueda bidireccional: el filtro puede estar contenido en el nombre o viceversa).

### `getProductsBy(key, values)`
Busca un producto en `productsList` por cualquier campo. Se usa para obtener el objeto completo del producto seleccionado a partir del SKU.

### `updateFullPhoneNumber()`
Combina el código de marcación del país (de intl-tel-input) con el número ingresado para construir `fullPhoneNumber` en formato E.164 (`+573001234567`).

### `submitForm(e)`
Valida el formulario completo antes de enviar:
- Ciudad y vitrina seleccionadas
- Checkbox de autorización marcado
- Email con formato válido (regex)
- Valida el código captcha vía SDK

### `createProposal(json)`
Construye el objeto de propuesta y llama a `proposalbot.generate()`. Si la respuesta incluye `res.url`, redirige al usuario a WhatsApp con el link de la cotización.

---

## ⚙️ Variables de configuración

Para adaptar el bot a un nuevo cliente, cambiar estas variables al inicio del `<script>` en el archivo HTML:

```js
var domain           = 'cliente.prolibu.com';       // dominio del cliente en Prolibu
var botName          = 'NombreDelBot';               // nombre del chatbot configurado
var bearerToken      = 'xxxx-xxxx-xxxx-xxxx';        // token de autenticación de productos
var currency         = 'COP';                        // moneda (COP, USD, etc.)
const pricingListFilter = 'NombreLista';             // filtra qué productos mostrar
const departmentFilter  = 'departamento';            // filtra qué agentes mostrar
const pipelineId     = '000000000';                  // ID del pipeline en HubSpot
const dealstageId    = '000000000';                  // ID del dealstage en HubSpot
const useWebhookHubspot = true;                      // activar/desactivar integración HubSpot
```

---

## 🚀 Flujo de trabajo — Cómo actualizar el bot

```bash
# 1. Editar el archivo del bot en VS Code
# 2. Guardar cambios
# 3. Subir a GitHub

git add {cliente}-bot.html
git commit -m "descripción del cambio"
git push origin main

# GitHub Pages publica automáticamente en ~1-2 minutos
# El bot en la plataforma se actualiza solo sin tocar el editor
```

---

## 🐛 Debug — Logs del loader

El `loader.js` incluye logs detallados en consola. Para diagnosticar problemas abrir `F12 → Console`:

| Log | Qué significa |
|-----|---------------|
| `🚀 [LOADER] Iniciando...` | El script se ejecutó correctamente |
| `📡 [LOADER] Respuesta HTTP: 200 OK` | GitHub respondió bien |
| `✅ [LOADER] Cargado: {url}` | Un script externo cargó correctamente |
| `⚠️ [LOADER] Error cargando: {url}` | Un script externo falló (no bloquea) |
| `🎉 [LOADER] Bot completamente cargado.` | Todo listo |
| `🔎 [LOADER] productsList: 0 items` | La API de productos no retornó datos o el filtro no coincide |
| `🔎 [LOADER] agentsList: 0 items` | No hay agentes con el departamento configurado |
| `❌ [LOADER] Error: HTTP 404` | El archivo HTML no se encontró en el repo |

---

## 🔑 GitHub Pages — Configuración

Para que el sistema funcione, GitHub Pages debe estar activo en el repositorio:

1. Ir a `Settings → Pages`
2. Source: **Deploy from a branch**
3. Branch: **main** → **/ (root)**
4. Guardar

URL resultante: `https://{usuario}.github.io/{repo}/`

> **¿Por qué GitHub Pages y no `raw.githubusercontent.com` directamente?**  
> Algunas plataformas bloquean `raw.githubusercontent.com` por CSP. GitHub Pages usa el dominio `github.io` que no tiene esa restricción y permite la carga de scripts sin problemas.

---

## 📋 Checklist — Nuevo cliente

- [ ] Duplicar `voyah-bot.html` → renombrar `{cliente}-bot.html`
- [ ] Actualizar variables de configuración (`domain`, `botName`, `bearerToken`, etc.)
- [ ] Actualizar `pricingListFilter` y `departmentFilter`
- [ ] Actualizar ciudades en el `<select#ciudad>`
- [ ] Actualizar imagen de fondo (`background-image`)
- [ ] Actualizar `REPO_RAW` en `loader.js` para apuntar al nuevo archivo HTML
- [ ] Verificar que GitHub Pages esté activo
- [ ] Pegar las 2 líneas en el editor de la plataforma
- [ ] Probar en F12 que `productsList` y `agentsList` tengan items

---

## 🤖 Prompt genérico para generar un bot desde cero con IA

Usar este prompt con cualquier IA (Claude, ChatGPT, Copilot) para generar un bot nuevo desde cero. Completar las secciones entre `[ ]` con la información del cliente.

````
Necesito que construyas un bot de cotización automotriz en un solo archivo HTML
que funcionará embebido en una plataforma web via un loader.js externo.

## Stack y librerías requeridas (cargar en este orden exacto via <script>)
1. jQuery 2.2.2 — https://ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min.js
2. Nodriza SDK  — https://s3.amazonaws.com/cdn.nodriza.io/sdk/nodriza@lastest/nodriza-sdk.bundle.js
3. Lodash 4.17  — https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.core.min.js
4. Select2 4.1  — https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js
5. intl-tel-input 17 — https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js

CSS requerido:
- https://s3.amazonaws.com/cdn.nodriza.io/assets/css/chatbot.automotriz.css
- https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css
- https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.css

## Variables de configuración
```js
var domain              = '[cliente.prolibu.com]';
var botName             = '[NombreDelBot]';
var bearerToken         = '[xxxx-xxxx-xxxx-xxxx]';
var currency            = '[COP]';
const pricingListFilter = '[NombreDeLaLista]';
const departmentFilter  = '[nombre_departamento]';
const pipelineId        = '[ID_pipeline_hubspot]';
const dealstageId       = '[ID_dealstage_hubspot]';
const useWebhookHubspot = true;
```

## Ciudades y vitrinas disponibles
[Listar ciudades. Ejemplo:]
- Bogotá
- Medellín
- Chía

## Imagen de fondo
URL: [https://url-de-la-imagen.jpg]

## APIs a consumir

### 1. Cargar agentes
GET https://${domain}/v1/publicservices/getAgents
Params: { status: 'active', roles: ['agent'] }
Sin Authorization header.
Filtrar por: department === departmentFilter
Campos a mapear del objeto agente:
- email → identificador del asesor
- firstName / firstname → nombre
- lastName / lastname → apellido
- [indicar qué campo contiene la ciudad del asesor]
- [indicar qué campo contiene la vitrina del asesor]

### 2. Cargar productos
GET https://${domain}/v1/product
Params: { limit: 1000 }
Authorization: Bearer ${bearerToken}
Filtrar por: pricingList contiene pricingListFilter
Campos a usar: sku (id del producto), name (nombre a mostrar), disabled

### 3. Captcha
Cargar como <embed> en el formulario:
https://${domain}/v1/ConfirmationCode/?color=white&noise=2&size=4

### 4. Validar captcha
nodriza.api.confirmationCode.confirm({ code }, callback)
Si válido → callback recibe results.hash → incluirlo en la propuesta

### 5. Generar propuesta
nodriza.api.proposalbot.generate(options, callback)
options incluye: chatbot, to (firstName, lastName, mobile, email, agent),
doc (title, products[{id:sku, quantity:1}], status:'Ready', currency,
metadata con webhook/pipeline/dealstage/customAttributes, dic:{hash})
Si exitoso → redirigir a WhatsApp con res.url

## Lógica de asignación de asesores
Usar balanceo round-robin:
- Filtrar agentsList por ciudad y vitrina seleccionada
- Rotar con currentAgentIndex % filtered.length
- currentAgentIndex inicia en Math.floor(Math.random() * 1000)

## Flujo del formulario
1. Al cargar: llamar loadAgents() y loadProducts() en paralelo
2. Select de modelo: populated con getSelectedProducts() usando Select2
3. Select de ciudad: opciones fijas definidas arriba
4. Al cambiar ciudad: mostrar select de vitrina con vitrinas disponibles para esa ciudad
5. Campos de datos: nombres, apellidos, celular (con intl-tel-input, país inicial: co), email
6. Captcha: embed + input para ingresar el código
7. Checkboxes: autorización de datos (requerido) y promociones (opcional)
8. Submit: validar → confirmar captcha → createProposal → WhatsApp

## Diseño
[Describir el estilo que quieres. Ejemplo:]
- Fondo oscuro negro #07080a
- Acento en color [color] — [hex]
- Layout: imagen a pantalla completa arriba, formulario horizontal abajo
- Tipografía: [nombre de fuente de Google Fonts]
- Campos en fila de [N] columnas en desktop, [N] en mobile

## Contenedor en la plataforma
El HTML del bot se inyectará dentro de <div id="bot-[cliente]">.
NO usar document.write. NO depender de que el DOM de la página tenga
elementos específicos fuera del contenedor.

## Resultado esperado
Un único archivo .html que contenga todo (CSS, HTML, JS).
Sin dependencias externas adicionales a las listadas.
El archivo debe funcionar cuando sea cargado dinámicamente via fetch
e inyectado en el DOM por el loader.js.
````

> **Tip:** mientras más detallado sea el mapeo de campos de agentes y el diseño, mejor será el resultado. Si no conoces la estructura exacta del objeto agente, ejecuta primero la API y revisa la respuesta en F12 → Network.