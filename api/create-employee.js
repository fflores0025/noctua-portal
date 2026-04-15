const admin = require('firebase-admin')

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://inout-connect.vercel.app')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { email, nombre, firestoreId } = req.body

  if (!email || !nombre) {
    return res.status(400).json({ error: 'Email y nombre son obligatorios' })
  }

  try {
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    
    let userRecord
    try {
      userRecord = await admin.auth().createUser({
        email,
        password: tempPassword,
        displayName: nombre,
      })
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        userRecord = await admin.auth().getUserByEmail(email)
      } else {
        throw e
      }
    }

    const db = admin.firestore()

    // Si hay un firestoreId antiguo, migrar los datos al nuevo documento con el UID correcto
    if (firestoreId && firestoreId !== userRecord.uid) {
      const oldDoc = await db.collection('Usuarios').doc(firestoreId).get()
      if (oldDoc.exists) {
        // Crear nuevo documento con el UID de Auth
        await db.collection('Usuarios').doc(userRecord.uid).set(oldDoc.data())
        // Borrar el antiguo
        await db.collection('Usuarios').doc(firestoreId).delete()
      }
    }

    // Generar link de reset para que el empleado establezca su contraseña
    await admin.auth().generatePasswordResetLink(email)

    return res.status(200).json({ 
      success: true, 
      uid: userRecord.uid
    })

  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
