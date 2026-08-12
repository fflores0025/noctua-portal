# Portal cautivo STAFF (FAS para OpenNDS)

Página de login que actúa como **Forwarding Authentication Service (FAS)** para
el captive portal [openNDS](https://opennds.readthedocs.io/) que corre en los
routers OpenWrt de INOUT Network. Cuando un trabajador se conecta al Wi-Fi de
un evento, el router lo redirige aquí; esta página valida sus credenciales
contra la tabla `empleados` de Supabase (mismo login que el resto del portal)
y, si son correctas, autoriza su acceso a Internet en ese router.

## Cómo funciona

1. El router bloquea el tráfico del dispositivo y lo redirige a `FAS_URL`
   (esta página), añadiendo un parámetro `fas` en base64 con `clientip`,
   `clientmac`, `gatewayname`, `hid`, `gatewayaddress`, `authdir`,
   `originurl`, `clientif`, etc. (protocolo `fas_secure_enabled = 1`).
2. `captive/index.html` parsea `?fas=...` y muestra el formulario de login.
3. Al enviar el formulario, el navegador llama a `POST /api/authorize` con
   `{ fas, email, password }`.
4. `api/authorize.js` (Vercel Function, server-side):
   - Valida las credenciales contra Supabase Auth
     (`supabase.auth.signInWithPassword`).
   - Comprueba que el empleado existe y está activo
     (`empleados.activo = true` y `empleados.estado != 'baja'`).
   - Calcula `tok = sha256(hid + OPENNDS_FAS_KEY)` — el mismo algoritmo del
     script de referencia oficial de openNDS
     [`fas-hid.php`](https://github.com/openNDS/openNDS/blob/master/forward_authentication_service/fas-hid/fas-hid.php).
   - Devuelve la URL de autorización del router:
     `http://<gatewayaddress>/opennds_auth/?tok=...&redir=...&custom=...`
5. El navegador es redirigido a esa URL; el router recalcula el mismo hash
   con su `fas_key` local, y si coincide, abre el acceso a Internet para el
   `clientmac` de ese dispositivo.

El `OPENNDS_FAS_KEY` (secreto compartido con el router) **nunca** se expone
al navegador — todo el cálculo del hash vive en `api/authorize.js`.

## Configuración en el router (openNDS)

En `/etc/opennds/opennds.conf` (o vía LuCI, paquete `opennds`):

```
fas_secure_enabled 1
fasport 443
fas_remote_fqdn wifcau.inout-media.es
fas_path /captive/index.html
fas_key TU_SECRETO_COMPARTIDO
```

- `fas_secure_enabled 1` — nivel recomendado (nunca usar `0`, que manda el
  token en claro).
- `fas_key` debe ser **exactamente igual** al valor de la variable de entorno
  `OPENNDS_FAS_KEY` configurada en Vercel.
- `fas_remote_fqdn` + `fas_path` forman la `FAS_URL` completa a la que el
  router redirige al cliente:
  `https://wifcau.inout-media.es/captive/index.html`.

Tras guardar la configuración: `service opennds restart` (o reinicio desde LuCI).

## Variables de entorno (Vercel)

```
SUPABASE_URL              # https://raoxkjnwrccoxjcipfpv.supabase.co
SUPABASE_ANON_KEY         # anon key del proyecto Supabase
OPENNDS_FAS_KEY           # secreto compartido con el router — NUNCA en el frontend
```

## Fuera de alcance para v1

- RADIUS centralizado / multi-router.
- Túnel VPN entre routers y servidor central.
- Perfiles de red diferenciados (STAFF/VIP/ARTISTA/ADMIN) — la tabla
  `empleados` no distingue tipo de acceso todavía, solo si está activo.
- Portal para invitados/asistentes (esto es solo para STAFF).
