import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id)
  if (req.method === 'PUT') {
    const { nomor, nama, karakter } = req.body
    if (!nomor || !nama || !karakter) {
      return res.status(400).json({ message: 'Data tidak lengkap' })
    }
    const updatePeserta = await prisma.peserta.update({
      where: { id },
      data: { nomor, nama, karakter },
    })
    res.status(200).json(updatePeserta)
  } else if (req.method === 'DELETE') {
    await prisma.peserta.delete({ where: { id } })
    res.status(204).end()
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
