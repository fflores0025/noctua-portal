import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { email, nombre, departamento, role, tipo, salario_base, irpf } = req.body
  if (!email || !nombre) {
    return res.status(400).json({ error: 'Email y nombre son obligatorios' })
  }

  try {
    // Crear usuario en Supabase Auth
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirmar email
    })

    if (authError && authError.message !== 'A user with this email address has already been registered') {
      throw authError
    }

    const auth_user_id = authData?.user?.id || null

    // Si el usuario ya existía, obtener su ID
    let finalAuthId = auth_user_id
    if (!finalAuthId) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existing = existingUsers?.users?.find(u => u.email === email)
      finalAuthId = existing?.id || null
    }

    // Crear registro en tabla empleados
    const { data: empleado, error: empError } = await supabase
      .from('empleados')
      .upsert({
        auth_user_id: finalAuthId,
        email,
        nombre,
        departamento: departamento || 'General',
        role: role || 'empleado',
        tipo: tipo || 'fijo',
        salario_base: salario_base || 0,
        irpf: irpf || 15,
        estado: 'activo',
        fecha_alta: new Date().toISOString().slice(0, 10),
      }, { onConflict: 'email' })
      .select()
      .single()

    if (empError) throw empError

    // Enviar email de reset para que establezca su contraseña
    if (finalAuthId) {
      await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: 'https://inout-connect.vercel.app' }
      })
    }

    return res.status(200).json({ success: true, empleado })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
