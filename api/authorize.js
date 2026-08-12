import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const FAS_KEY = process.env.OPENNDS_FAS_KEY

// Decodifica el parámetro `fas` que envía openNDS (fas_secure_enabled >= 1):
// un string base64 con pares "clave=valor" separados por ", "
// (mismo formato que el ejemplo oficial forward_authentication_service/fas-hid/fas-hid.php)
function parseFas(fasB64) {
  const decoded = Buffer.from(fasB64, 'base64').toString('utf8')
  const fields = {}
  decoded.split(', ').forEach(pair => {
    const i = pair.indexOf('=')
    if (i === -1) return
    fields[pair.slice(0, i).trim()] = pair.slice(i + 1).trim()
  })
  return fields
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  if (!FAS_KEY) {
    console.error('OPENNDS_FAS_KEY no configurada')
    return res.status(500).json({ error: 'Servicio no configurado' })
  }

  const { fas, email, password } = req.body || {}
  if (!fas || !email || !password) {
    return res.status(400).json({ error: 'Faltan credenciales o parámetros del router' })
  }

  let nds
  try {
    nds = parseFas(fas)
  } catch {
    return res.status(400).json({ error: 'Parámetros del router inválidos' })
  }

  const hid = nds.hid || nds.client_hid
  const gatewayaddress = nds.gatewayaddress
  if (!hid || !gatewayaddress) {
    return res.status(400).json({ error: 'Faltan parámetros del router (hid/gatewayaddress)' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError || !authData?.user) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' })
  }

  const { data: empleado, error: empError } = await supabase
    .from('empleados')
    .select('nombre, estado, activo')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle()

  if (empError || !empleado) {
    return res.status(403).json({ error: 'No tienes acceso al Wi-Fi de staff' })
  }
  if (empleado.activo === false || empleado.estado === 'baja') {
    return res.status(403).json({ error: 'Tu acceso está desactivado. Contacta con RRHH.' })
  }

  // Algoritmo oficial openNDS FAS (fas-hid.php): tok = sha256(hid + fas_key)
  // El router recalcula el mismo hash con su fas_key para validar sin que
  // el token real del cliente ni el fas_key viajen nunca por la red.
  const tok = crypto.createHash('sha256').update(String(hid) + FAS_KEY).digest('hex')

  const custom = Buffer.from(`empleado=${empleado.nombre}, email=${email}`).toString('base64')
  const redir = nds.originurl
    ? decodeURIComponent(nds.originurl)
    : `https://${req.headers.host}/captive/index.html?landing=1`
  const authaction = `http://${gatewayaddress}/opennds_auth/`
  const redirectUrl = `${authaction}?tok=${tok}&redir=${encodeURIComponent(redir)}&custom=${encodeURIComponent(custom)}`

  return res.status(200).json({ success: true, redirectUrl })
}
