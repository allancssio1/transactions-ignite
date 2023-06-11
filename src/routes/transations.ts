import crypto, { randomUUID } from 'node:crypto'
import { KnexDB } from '../database'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { checkSessionIdExists } from '../middleware/checkSessionIdExists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, reply) => {
      const { sessionId } = req.cookies
      const transactions = await KnexDB('transactions')
        .where('session_id', sessionId)
        .select('*')

      return { transactions }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamsSchema.parse(req.params)
      const { sessionId } = req.cookies

      const transaction = await KnexDB('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first() // first para trazer somente uma opção em forma de objeto.

      return { transaction }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const { sessionId } = req.cookies
      const summary = await KnexDB('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount  ' })
        .first()
      console.log(summary)

      return { summary }
    },
  )

  app.post('/', async (req, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
      })
    }

    await KnexDB('transactions')
      .insert({
        id: crypto.randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: sessionId,
      })
      .returning('*')
    return reply.code(201).send()
  })
}
