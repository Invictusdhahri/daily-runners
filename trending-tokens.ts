import fetch from 'node-fetch';

interface TrendingPool {
  id: string;
  type: string;
  attributes: {
    name: string;
    base_token_name: string;
    base_token_symbol: string;
    quote_token_name: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    volume_usd: {
      h24: string;
    };
    price_change_percentage: {
      h24: string;
    };
    market_cap_usd: string;
    dex_id: string;
    base_token_address: string;
    pool_address: string;
    fdv_usd: string;
    reserve_in_usd: string;
  };
  relationships: {
    base_token: {
      data: {
        id: string;
        type: string;
      };
    };
    dex: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

interface TokenInfo {
  data: {
    attributes: {
      image_url: string;
      holders: {
        count: number;
      };
    };
  };
}

export interface SimplifiedPoolInfo {
  coin_name: string;
  coin_price: string;
  market_cap: string;
  volume_24h: string;
  dex_name: string;
  liquidity: string;
  token_address: string;
  image_url: string;
  holders: number;
  price_change_24h: string;
}

interface TrendingPoolsResponse {
  data: TrendingPool[];
  included?: any[];
}

// Cache for token info to avoid redundant API calls
const tokenInfoCache: Map<string, { imageUrl: string; holders: number }> = new Map();

export async function getTrendingPools(): Promise<SimplifiedPoolInfo[]> {
  try {
    const response = await fetch(
      'https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?include=included&page=1&duration=24h',
      {
        headers: {
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch trending pools: ${response.status} ${response.statusText}`);
    }

    const data: TrendingPoolsResponse = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format: missing or invalid data array');
    }

    // Process pools in parallel with a limit of 5 concurrent requests
    const batchSize = 5;
    const results: SimplifiedPoolInfo[] = [];
    const filteredPools = data.data.filter(pool => 
      pool.attributes && parseFloat(pool.attributes.reserve_in_usd || '0') >= 1000
    );

    for (let i = 0; i < filteredPools.length; i += batchSize) {
      const batch = filteredPools.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processPool));
      results.push(...batchResults.filter(Boolean)); // Filter out any null/undefined results
    }

    return results;
  } catch (error) {
    console.error('Error fetching trending pools:', error);
    throw error;
  }
}

async function processPool(pool: TrendingPool): Promise<SimplifiedPoolInfo> {
  try {
    if (!pool.attributes) {
      console.warn('Pool missing attributes:', pool);
      return {
        coin_name: 'Unknown',
        coin_price: '0',
        market_cap: '0',
        volume_24h: '0',
        dex_name: 'Unknown',
        liquidity: '0',
        token_address: '',
        image_url: '',
        holders: 0,
        price_change_24h: '0'
      };
    }

    const poolName = pool.attributes.name || '';
    const [baseToken] = poolName.split('/');
    const coinName = pool.attributes.base_token_name || baseToken || 'Unknown';
    const marketCap = pool.attributes.market_cap_usd || pool.attributes.fdv_usd || '0';
    const dexId = pool.relationships?.dex?.data?.id || '';
    const dexName = getDexName(dexId);
    const tokenAddress = pool.attributes.base_token_address || 
      pool.relationships?.base_token?.data?.id?.replace('solana_', '') || '';

    if (!tokenAddress) {
      console.warn('Pool missing token address:', pool);
      return {
        coin_name: coinName,
        coin_price: '0',
        market_cap: marketCap,
        volume_24h: '0',
        dex_name: dexName,
        liquidity: '0',
        token_address: '',
        image_url: '',
        holders: 0,
        price_change_24h: '0'
      };
    }

    let tokenInfo = tokenInfoCache.get(tokenAddress);

    if (!tokenInfo) {
      tokenInfo = await fetchTokenInfo(tokenAddress);
      if (tokenInfo) {
        tokenInfoCache.set(tokenAddress, tokenInfo);
      }
    }

    return {
      coin_name: coinName,
      coin_price: pool.attributes.base_token_price_usd || '0',
      market_cap: marketCap,
      volume_24h: pool.attributes.volume_usd?.h24 || '0',
      dex_name: dexName,
      liquidity: pool.attributes.reserve_in_usd || '0',
      token_address: tokenAddress,
      image_url: tokenInfo?.imageUrl || '',
      holders: tokenInfo?.holders || 0,
      price_change_24h: pool.attributes.price_change_percentage?.h24 || '0'
    };
  } catch (error) {
    console.error('Error processing pool:', error);
    return {
      coin_name: 'Unknown',
      coin_price: '0',
      market_cap: '0',
      volume_24h: '0',
      dex_name: 'Unknown',
      liquidity: '0',
      token_address: '',
      image_url: '',
      holders: 0,
      price_change_24h: '0'
    };
  }
}

async function fetchTokenInfo(tokenAddress: string): Promise<{ imageUrl: string; holders: number }> {
  try {
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${tokenAddress}/info`,
      {
        headers: {
          'accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      return { imageUrl: '', holders: 0 };
    }

    const tokenInfo: TokenInfo = await response.json();
    return {
      imageUrl: tokenInfo.data.attributes.image_url || '',
      holders: tokenInfo.data.attributes.holders?.count || 0
    };
  } catch (error) {
    console.error(`Failed to fetch token info for ${tokenAddress}:`, error);
    return { imageUrl: '', holders: 0 };
  }
}

function getDexName(dexId: string): string {
  if (!dexId) return 'Unknown';

  const dexNames: { [key: string]: string } = {
    'raydium': 'Raydium',
    'orca': 'Orca',
    'jupiter': 'Jupiter',
    'marinade': 'Marinade',
    'saber': 'Saber',
    'openbook': 'OpenBook',
    'aldrin': 'Aldrin',
    'serum': 'Serum',
    'lifinity': 'Lifinity',
    'cropper': 'Cropper',
    'dexlab': 'Dexlab',
    'step': 'Step',
    'atrix': 'Atrix',
    'phoenix': 'Phoenix',
    'meteora': 'Meteora',
    'invariant': 'Invariant',
    'balansol': 'Balansol',
    'crema': 'Crema',
    'tensor': 'Tensor',
    'dradex': 'DraDex',
    'saros': 'Saros',
    'cykura': 'Cykura',
    'penguin': 'Penguin',
    'goosefx': 'GooseFX',
    'symmetry': 'Symmetry',
    'mercurial': 'Mercurial',
    'mango': 'Mango',
    'drift': 'Drift',
    'raydium-v3': 'Raydium',
    'orca-v2': 'Orca',
    'raydiumv3': 'Raydium'
  };

  return dexNames[dexId] || 'Unknown';
} 