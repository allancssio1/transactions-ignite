import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { transactionsRoutes } from './routes/transations'

export const app = fastify()

app.register(cookie)
// rotas no fastfy é chamado de plugins
// transactionsRoutes é o arquivo de rotas
// prefix mostra que /transactions/... e etc.

app.register(transactionsRoutes, {
  prefix: 'transactions',
})
