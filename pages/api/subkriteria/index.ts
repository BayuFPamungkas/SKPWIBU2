import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { nama, kriteriaId } = req.body
    if (!nama || !kriteriaId) return res.status(400).json({ message: 'Data kurang lengkap' })

    const subKriteria = await prisma.subKriteria.create({
      data: { nama, kriteriaId: Number(kriteriaId) },
    })
    return res.status(201).json(subKriteria)
  }
  
  res.status(405).json({ message: 'Method not allowed' })
}

