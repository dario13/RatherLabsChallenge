import { task } from 'hardhat/config'
import { sortAddresses, validateAddresses } from '../utils/addressTools'
import { makeQueryGraphQl } from '../utils/makeQueryGraphQl'

const getPairFromApi = async (token0: string, token1: string): Promise<string> => {
  const query = `
      {
        pairs(
          where: {
            token0: "${token0.toLowerCase()}",
            token1: "${token1.toLowerCase()}"
          }
        ) {
          id
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
      } 
    `

  const url = 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange'

  const response = await makeQueryGraphQl(query, url)

  const pairAddress = response.data?.data?.pairs[0]?.id ? response.data.data.pairs[0].id : ''

  return pairAddress
}

task(
  'getPair',
  'Get the Pair(pool) address of two tokens' +
    'Example: yarn hardhat getPair --token0 {address} --token1 {address} --network localhost',
)
  .addParam('token0', 'The address of token0')
  .addParam('token1', 'The address of token1')
  .setAction(async (taskArgs, hre) => {
    const { token0, token1 } = taskArgs
    validateAddresses([token0, token1])

    // Sort addresses
    const { addressA, addressB } = sortAddresses(token0, token1)

    const pairAddressFromApi = await getPairFromApi(addressA, addressB)

    if (!pairAddressFromApi) {
      console.log('Pair token not found')
    }

    return pairAddressFromApi
  })
