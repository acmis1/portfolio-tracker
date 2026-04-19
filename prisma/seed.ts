import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const SEED_USER_ID = "user_2p5t8J3XkK8mN1q0v6S4H2L9R6A" // Example Clerk ID for dev seeding

async function main() {
  console.log('Clearing existing data...')
  await prisma.transaction.deleteMany({})
  await prisma.dailyPrice.deleteMany({})
  await prisma.asset.deleteMany({})

  console.log('Seeding assets...')
  const btc = await prisma.asset.create({
    data: {
      symbol: 'BTC',
      name: 'Bitcoin',
      assetClass: 'CRYPTO',
      userId: SEED_USER_ID
    },
  })

  const fpt = await prisma.asset.create({
    data: {
      symbol: 'FPT',
      name: 'FPT Corporation',
      assetClass: 'STOCK',
      userId: SEED_USER_ID
    },
  })

  const vcb = await prisma.asset.create({
    data: {
      symbol: 'VCB',
      name: 'Vietcombank',
      assetClass: 'STOCK',
      userId: SEED_USER_ID
    },
  })

  console.log('Seeding daily prices (last 30 days)...')
  const assets = [
    { id: btc.id, base: 1515000000, volatility: 0.05 },
    { id: fpt.id, base: 135000, volatility: 0.01 },
    { id: vcb.id, base: 92000, volatility: 0.008 },
  ]

  for (const asset of assets) {
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      // Random price growth
      const randomFactor = 1 + (Math.random() - 0.45) * asset.volatility
      asset.base *= randomFactor

      await prisma.dailyPrice.create({
        data: {
          assetId: asset.id,
          date,
          closePrice: Math.round(asset.base),
          source: asset.id === btc.id ? 'coingecko' : 'vndirect',
        },
      })
    }
  }

  console.log('Seeding transactions...')
  const today = new Date()

  // 1. BUY BTC (30 days ago)
  const btcPrice30 = await prisma.dailyPrice.findFirst({
    where: { assetId: btc.id, date: { lte: new Date(new Date().setDate(today.getDate() - 30)) } },
    orderBy: { date: 'desc' }
  })
  await prisma.transaction.create({
    data: {
      assetId: btc.id,
      userId: SEED_USER_ID,
      type: 'BUY',
      quantity: 0.05,
      pricePerUnit: btcPrice30?.closePrice || 1500000000,
      grossAmount: -((0.05 * (btcPrice30?.closePrice || 1500000000)) + 50000),
      date: new Date(new Date().setDate(today.getDate() - 30)),
    }
  })

  // 2. BUY FPT (25 days ago)
  const fptPrice25 = await prisma.dailyPrice.findFirst({
    where: { assetId: fpt.id, date: { lte: new Date(new Date().setDate(today.getDate() - 25)) } },
    orderBy: { date: 'desc' }
  })
  await prisma.transaction.create({
    data: {
      assetId: fpt.id,
      userId: SEED_USER_ID,
      type: 'BUY',
      quantity: 1000,
      pricePerUnit: fptPrice25?.closePrice || 135000,
      grossAmount: -((1000 * (fptPrice25?.closePrice || 135000)) + 150000),
      date: new Date(new Date().setDate(today.getDate() - 25)),
    }
  })

  // 3. BUY VCB (20 days ago)
  const vcbPrice20 = await prisma.dailyPrice.findFirst({
    where: { assetId: vcb.id, date: { lte: new Date(new Date().setDate(today.getDate() - 20)) } },
    orderBy: { date: 'desc' }
  })
  await prisma.transaction.create({
    data: {
      assetId: vcb.id,
      userId: SEED_USER_ID,
      type: 'BUY',
      quantity: 500,
      pricePerUnit: vcbPrice20?.closePrice || 92000,
      grossAmount: -((500 * (vcbPrice20?.closePrice || 92000)) + 100000),
      date: new Date(new Date().setDate(today.getDate() - 20)),
    }
  })

  // 4. SELL BTC (10 days ago) - selling half (0.025)
  const btcPrice10 = await prisma.dailyPrice.findFirst({
    where: { assetId: btc.id, date: { lte: new Date(new Date().setDate(today.getDate() - 10)) } },
    orderBy: { date: 'desc' }
  })
  await prisma.transaction.create({
    data: {
      assetId: btc.id,
      userId: SEED_USER_ID,
      type: 'SELL',
      quantity: 0.025,
      pricePerUnit: btcPrice10?.closePrice || 1600000000,
      grossAmount: (0.025 * (btcPrice10?.closePrice || 1600000000)) - 50000,
      date: new Date(new Date().setDate(today.getDate() - 10)),
    }
  })

  // 5. BUY BTC (5 days ago) - buying back 0.015
  const btcPrice5 = await prisma.dailyPrice.findFirst({
    where: { assetId: btc.id, date: { lte: new Date(new Date().setDate(today.getDate() - 5)) } },
    orderBy: { date: 'desc' }
  })
  await prisma.transaction.create({
    data: {
      assetId: btc.id,
      userId: SEED_USER_ID,
      type: 'BUY',
      quantity: 0.015,
      pricePerUnit: btcPrice5?.closePrice || 1550000000,
      grossAmount: -((0.015 * (btcPrice5?.closePrice || 1550000000)) + 30000),
      date: new Date(new Date().setDate(today.getDate() - 5)),
    }
  })

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
