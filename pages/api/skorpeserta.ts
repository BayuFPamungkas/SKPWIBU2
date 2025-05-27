// /pages/api/skorpeserta.ts
import prisma from '@/lib/db'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { data } = req.body // [{ pesertaId, subKriteriaId, nilai }]
      if (!Array.isArray(data)) return res.status(400).json({ error: 'Invalid data format' })

      const ops = data.map(item =>
        prisma.skorPeserta.upsert({
          where: {
            pesertaId_subKriteriaId: {
              pesertaId: item.pesertaId,
              subKriteriaId: item.subKriteriaId
            }
          },
          update: { nilai: item.nilai },
          create: { pesertaId: item.pesertaId, subKriteriaId: item.subKriteriaId, nilai: item.nilai }
        })
      )

      await Promise.all(ops)
      res.status(200).json({ success: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to save scores' })
    }
  } else {
    res.status(405).end()
  }
}
