// test e it tem a mesma funcionalidade, mas o it é usado mais para descrever possibilidade da aplicação
import { expect, it, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest' // rodar testes sem ter que subir aplicação inteira (obs: instalar @types junto)
import { app } from '../src/app'

describe('Transactions routes', () => {
  /*
  - No Fastify as rotas (plugins) são promises (async).
  beforeAll do vitest vai executar uma vez para rodar uma função
  antes (por isso before) para não quebrar. 
  - Neste caso a função vai aguardar o app estar pronto antes de rodar os
  testes.
*/
  beforeAll(async () => {
    await app.ready()
  })

  /*
- Neste caso a função vai fechar o app após os testes terminarem de rodar.
*/
  afterAll(async () => {
    await app.close()
  })

  /*
    ao alterar o dotenv para test, as migrations no knex nao foram rodadas.
    então essa configuração do beforeEach vai rodar antes de cada teste
    usando execSync no node:child_process para dorar comandos de terminal pelo código;
    entao ele vai usar um rollback para apagar o banco de dados
    e em seguida latest para criar um banco de dados novo para os testes.
  */
  beforeEach(() => {
    execSync('yarn knex -- migrate:rollback --all')
    execSync('yarn knex -- migrate:latest')
  })

  it('Should be able to create a new transaction.', async () => {
    const reponse = await request(app.server).post('/transactions').send({
      title: 'new transation test',
      amount: 5000,
      type: 'credit',
    })
    // .expect(201)

    expect(reponse.status).toEqual(201)
  })

  it('Should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'new transation test',
        amount: 5000,
        type: 'credit',
      })

    const coockies = createTransactionResponse.get('Set-Cookie')

    const response = await request(app.server)
      .get('/transactions')
      .set('Cookie', coockies)

    expect(response.status).toEqual(200)
    // essa verificação vai observar se dentro no corpo da resposta possue esses campos passados.
    expect(response.body.transactions).toEqual([
      expect.objectContaining({
        title: 'new transation test',
        amount: 5000,
      }),
    ])
  })

  it('Should be able to list transaction by id', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'new transation test',
        amount: 5000,
        type: 'credit',
      })

    const coockies = createTransactionResponse.get('Set-Cookie')

    const listTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', coockies)

    const transactionId = listTransactionResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', coockies)

    expect(getTransactionResponse.status).toEqual(200)
    // essa verificação vai observar se dentro no corpo da resposta possue esses campos passados.
    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'new transation test',
        amount: 5000,
      }),
    )
  })
})
