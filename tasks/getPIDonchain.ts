import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { task } from 'hardhat/config'
import {
  IUniswapV2Factory,
  IUniswapV2Factory__factory,
  PoolIdFinder,
  PoolIdFinder__factory,
} from '../typechain-types'
import { NetWorkInfo } from './network-info'
import { checkAddresses } from '../utils/checkAddresses'

task(
  'getPIDonchain',
  'Get onchain the pair token address and the poolID' +
    'Example: yarn hardhat getPIDonchain --token0 {address} --token1 {address} --network localhost',
)
  .addParam('token0', 'The address of token0')
  .addParam('token1', 'The address of token1')
  .setAction(async (taskArgs, hre) => {
    const { token0, token1 } = taskArgs
    checkAddresses([token0, token1])

    const { sushiV2FactoryAddress }: NetWorkInfo = await hre.run('networkInfo')

    if (!sushiV2FactoryAddress) {
      throw new Error('SushiV2Factory address not specified')
    }

    // Get signer information
    const accounts: SignerWithAddress[] = await hre.ethers.getSigners()
    const signer: SignerWithAddress = accounts[0]

    const sushiV2Factory: IUniswapV2Factory = IUniswapV2Factory__factory.connect(
      sushiV2FactoryAddress,
      signer,
    )

    const pairToken = await sushiV2Factory.getPair(token0, token1)

    if (pairToken === '0x0000000000000000000000000000000000000000') {
      console.log('Pair token not found')
      return
    }

    console.log('Pair Token address: ', pairToken)

    const poolIdFinderDeployment = await hre.deployments.get('PoolIdFinder')

    const poolIdFinder: PoolIdFinder = await PoolIdFinder__factory.connect(
      poolIdFinderDeployment.address,
      signer,
    )

    const { poolIdInMasterChefV1, poolIdInMasterChefV2, masterChefVersionFound } =
      await poolIdFinder.getPoolIdAndMasterChefVersion(pairToken)

    if (masterChefVersionFound === 3) {
      console.log('Pool not found')
      return
    }

    if (masterChefVersionFound === 0) {
      console.log('Pool only found in MasterChefV1')
      console.log('Pool ID found in MasterChefV1: ', poolIdInMasterChefV1.toString())
      return
    }

    if (masterChefVersionFound === 1) {
      console.log('Pool only found in MasterChefV2')
      console.log('Pool ID found in MasterChefV2: ', poolIdInMasterChefV2.toString())
      return
    }

    if (masterChefVersionFound === 2) {
      console.log('Pool found in both MasterChefV1 and MasterChefV2')
      console.log('Pool ID found in MasterChefV1: ', poolIdInMasterChefV1.toString())
      console.log('Pool ID found in MasterChefV2: ', poolIdInMasterChefV2.toString())
      return
    }
  })
