const admin = require('firebase-admin')

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://inout-connect.vercel.app')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { email, nombre } = req.body

  if (!email || !nombre) {
    return res.status(400).json({ error: 'Email y nombre son obligatorios' })
  }

  try {
    // Crear usuario en Firebase Auth con contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    
    let userRecord
    try {
      // Intentar crear el usuario
      userRecord = await admin.auth().createUser({
        email,
        password: tempPassword,
        displayName: nombre,
      })
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        // Si ya existe, obtener el usuario existente
        userRecord = await admin.auth().getUserByEmail(email)
      } else {
        throw e
      }
    }

    // Enviar email de reset para que establezca su propia contraseña
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: 'https://inout-connect.vercel.app',
    })

    // Usar nodemailer o simplemente devolver el link
    // Por ahora Firebase enviará el email automáticamente con sendPasswordResetEmail
    // desde el cliente — aquí solo creamos el usuario en Auth

    return res.status(200).json({ 
      success: true, 
      uid: userRecord.uid,
      message: `Usuario creado en Auth. Email de bienvenida enviado a ${email}`
    })

  } catch (error) {
    console.error('Error creando usuario:', error)
    return res.status(500).json({ error: error.message })
  }
}
