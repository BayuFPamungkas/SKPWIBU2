import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { username, password } = req.body

  const user = await prisma.user.findUnique({ where: { username } })

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Username atau password salah' })
  }

  res.status(200).json({ role: user.role })
}
