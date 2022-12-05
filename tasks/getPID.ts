import { sortAddresses, validateAddresses } from '../utils/addressTools'
import { theGraphApiKey } from '../env'
import { makeQueryGraphQl } from '../utils/makeQueryGraphQl'
import { task } from 'hardhat/config'

type Pool = {
  pairAddress: string
  pid: string
  version: string
}

const extractVersionAndPid = (pid: string): { version: string; pid: string } => {
  const version = pid.split('-')[0]
  const pidNumber = pid.split('-')[1]
  return { version, pid: pidNumber }
}

const getPidFromApi = async (pairAddress: string): Promise<Pool[] | undefined> => {
  const query = `
  {
    masterChefStakingPools(
      where: { poolAddress: "${pairAddress}" }
    ) {
      id
    }
  } 
    `
  const url = `https://gateway.thegraph.com/api/${theGraphApiKey}/subgraphs/id/7h1x51fyT5KigAhXd8sdE3kzzxQDJxxz1y66LTFiC3mS`

  const response = await makeQueryGraphQl(query, url)

  const matches =
    response.data?.data?.masterChefStakingPools?.length > 0
      ? response.data.data.masterChefStakingPools
      : []

  if (matches.length === 0) {
    return
  }

  const pools: Pool[] = matches.map((match: any) => {
    const { version, pid } = extractVersionAndPid(match.id)
    return {
      pairAddress,
      pid,
      version,
    }
  })

  return pools
}

task(
  'getPID',
  'Get the Pool ID of pair tokens' +
    'Example: yarn hardhat getPID --token0 {address} --token1 {address} --network localhost',
)
  .addParam('token0', 'The address of token0')
  .addParam('token1', 'The address of token1')
  .setAction(async (taskArgs, hre) => {
    const { token0, token1 } = taskArgs
    validateAddresses([token0, token1])

    const pairAddress = await hre.run('getPair', { token0, token1 })

    if (!pairAddress) {
      return
    }

    console.log('------------------------------------')
    console.log('Token0:', token0)
    console.log('Token1:', token1)
    console.log('Pair Address:', pairAddress)
    console.log('------------------------------------')

    const pid = await getPidFromApi(pairAddress)

    if (!pid) {
      console.log('Pool ID not found')
    }

    console.log('Pool Information: ', pid)
  })
