import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { deployments, ethers } from 'hardhat'
import { PoolIdFinder, PoolIdFinder__factory } from '../typechain-types'

describe('PoolIdFinder contract test', () => {
  let poolIdFinder: PoolIdFinder

  beforeEach(async () => {
    await deployments.fixture(['PoolIdFinder'])
    const accounts: SignerWithAddress[] = await ethers.getSigners()
    // 1 = userA
    const userA: SignerWithAddress = accounts[1]
    const poolIdFinderDeployment = await deployments.get('PoolIdFinder')

    poolIdFinder = PoolIdFinder__factory.connect(poolIdFinderDeployment.address, userA)
  })

  it(
    'Given the address of tokenA and tokenB when the getSLPTokenAddress function \
     is called then the address of the SLP token is returned',
    async () => {
      // Given
      const tokenA = '0x0391d2021f89dc339f60fff84546ea23e337750f'
      const tokenB = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

      // When
      const slpTokenAddress = await poolIdFinder.callStatic.getSLPTokenAddress(tokenA, tokenB)

      // Then
      expect(slpTokenAddress).to.equal('0x613C836DF6695c10f0f4900528B6931441Ac5d5a')
    },
  )

  it(
    'Given the address of SLP token when the getPoolIdAndMasterChefVersion function \
     is called then the pool ID and master chef version are returned',
    async () => {
      // Given
      const slpTokenAddress = '0x269db91fc3c7fcc275c2e6f22e5552504512811c'

      // When
      const { poolIdInMasterChefV1, poolIdInMasterChefV2, masterChefVersionFound } =
        await poolIdFinder.callStatic.getPoolIdAndMasterChefVersion(slpTokenAddress)

      // Then
      expect(poolIdInMasterChefV1).to.equal(35)
      expect(poolIdInMasterChefV2).to.equal(3)
      expect(masterChefVersionFound).to.equal(2)
    },
  )
})
