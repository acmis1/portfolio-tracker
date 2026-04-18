import { getPortfolioSummary } from '../src/features/portfolio/utils';

async function test() {
  try {
    console.log('Fetching portfolio summary...');
    const result = await getPortfolioSummary();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error during test:', error);
  }
}

test();
