import { expect } from 'chai'
import { deployments, ethers, getNamedAccounts } from 'hardhat'
import { IERC20, IMasterChefV1, IMasterChefV2, SmartWallet } from '../typechain-types'
import { setupNamedUsers } from './utils/setup-users'

const setup = async () => {
  // Configure users
  await deployments.fixture(['SmartWallet'])
  const { userA } = await getNamedAccounts()
  const userUSDC = '0x7720f2f6f6707d5f90f82dd6bebf8b7380f71f4b'
  const userQUARTZ = '0x0dfb070d8bb1b6ab8d3ed150160faf5fadc32145'

  const users = {
    userA,
    userUSDC,
    userQUARTZ,
  }

  // Impersonate users
  for (const user of Object.values(users)) {
    await ethers.provider.send('hardhat_impersonateAccount', [user])
  }

  // Transfer some eth to userUSDC and userQUARTZ
  const userAWallet = await ethers.getSigner(userA)
  await userAWallet.sendTransaction({ to: userUSDC, value: ethers.utils.parseEther('10') })
  await userAWallet.sendTransaction({ to: userQUARTZ, value: ethers.utils.parseEther('10') })

  //Configure contracts
  const USDCTokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  const QUARTZTokenAddress = '0xba8a621b4a54e61c442f5ec623687e2a942225ef'
  const pairTokenAddress = '0x1E888882D0F291DD88C5605108c72d414f29D460'
  const MasterChefAddress = '0xc2edad668740f1aa35e4d8f227fb8e17dca888cd'
  const MasterChefV2Address = '0xef0881ec094552b2e128cf945ef17a6752b4ec5d'

  const smartWalletContract: SmartWallet = await ethers.getContract('SmartWallet')
  const USDCContract: IERC20 = await ethers.getContractAt('IERC20', USDCTokenAddress)
  const QUARTZContract: IERC20 = await ethers.getContractAt('IERC20', QUARTZTokenAddress)
  const pairTokenContract: IERC20 = await ethers.getContractAt('IERC20', pairTokenAddress)
  const MasterChefContract: IMasterChefV1 = await ethers.getContractAt(
    'IMasterChefV1',
    MasterChefAddress,
  )
  const MasterChefV2Contract: IMasterChefV2 = await ethers.getContractAt(
    'IMasterChefV2',
    MasterChefV2Address,
  )

  const contracts = {
    SmartWallet: smartWalletContract,
    USDC: USDCContract,
    QUARTZ: QUARTZContract,
    pairToken: pairTokenContract,
    MasterChef: MasterChefContract,
    MasterChefV2: MasterChefV2Contract,
  }

  //Connect users with contracts
  const connectedUsers = await setupNamedUsers(users, contracts)

  //Fund user with tokens
  await connectedUsers.userUSDC.USDC.transfer(userA, '10000000000000')
  await connectedUsers.userQUARTZ.QUARTZ.transfer(userA, '1000000000000000000000')

  const poolId = 23
  const isMasterChefV2 = true
  const currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())

  return { connectedUsers, contracts, pairTokenAddress, poolId, isMasterChefV2, currentBlock }
}

describe('SmartWallet contract test', () => {
  it('Given a user who approved the SmartWallet to spend his tokens \
    when the user calls the SmartWallet to join the liquidity mining program \
    then the tokens are applied to a pool and the SLP tokens received are farmed', async () => {
    // Given
    const { connectedUsers, contracts, pairTokenAddress, poolId, isMasterChefV2, currentBlock } =
      await setup()
    const { userA } = connectedUsers
    const { SmartWallet } = contracts
    const USDCdecimals = 6
    const QUARTZdecimals = 18
    const USDCQuantity = '100'
    const QUARTZQuantity = '136.84'
    const USDCamountFormatted = ethers.utils.parseUnits(USDCQuantity, USDCdecimals)
    const QUARTZamountFormatted = ethers.utils.parseUnits(QUARTZQuantity, QUARTZdecimals)
    await userA.USDC.approve(SmartWallet.address, USDCamountFormatted)
    await userA.QUARTZ.approve(SmartWallet.address, QUARTZamountFormatted)

    // When
    const joinProgram = await userA.SmartWallet.joinLiquidityMiningProgram(
      contracts.USDC.address,
      contracts.QUARTZ.address,
      USDCamountFormatted,
      QUARTZamountFormatted,
      0,
      0,
      currentBlock.timestamp + 100,
      poolId,
      pairTokenAddress,
      isMasterChefV2,
    )

    // Then
    // Check if the farming event was emitted
    await expect(joinProgram).to.emit(userA.SmartWallet, 'FarmingIn')
    // Check if the amount staked in MasterChefV2 is the same as the amount emitted in the SmartWallet event
    const userInfo = await userA.MasterChefV2.userInfo(poolId, SmartWallet.address)
    await expect(joinProgram)
      .to.emit(userA.SmartWallet, 'FarmingIn')
      .withArgs(userA.address, pairTokenAddress, userInfo.amount)
  })

  it('Given a user who wants to withdraw an amount of SLP tokens \
    when the user calls the SmartWallet, then the SLP tokens are \
    withdrawn from MasterChef and the tokens are returned to the user', async () => {
    // Given
    const { connectedUsers, pairTokenAddress, poolId, isMasterChefV2, contracts, currentBlock } =
      await setup()
    const { SmartWallet } = contracts
    const { userA } = connectedUsers
    const amountToWithdraw = '10000000'
    // Join liquidity mining program
    const USDCdecimals = 6
    const QUARTZdecimals = 18
    const USDCQuantity = '100'
    const QUARTZQuantity = '136.84'
    const USDCamountFormatted = ethers.utils.parseUnits(USDCQuantity, USDCdecimals)
    const QUARTZamountFormatted = ethers.utils.parseUnits(QUARTZQuantity, QUARTZdecimals)
    await userA.USDC.approve(SmartWallet.address, USDCamountFormatted)
    await userA.QUARTZ.approve(SmartWallet.address, QUARTZamountFormatted)

    await userA.SmartWallet.joinLiquidityMiningProgram(
      contracts.USDC.address,
      contracts.QUARTZ.address,
      USDCamountFormatted,
      QUARTZamountFormatted,
      0,
      0,
      currentBlock.timestamp + 100,
      poolId,
      pairTokenAddress,
      isMasterChefV2,
    )

    // When
    const withdraw = await userA.SmartWallet.withdrawSLP(
      amountToWithdraw,
      isMasterChefV2,
      poolId,
      pairTokenAddress,
    )

    // Then
    // Check if the farming event was emitted
    await expect(withdraw)
      .to.emit(userA.SmartWallet, 'FarmingOut')
      .withArgs(userA.address, pairTokenAddress, amountToWithdraw)
    // Check user token balance
    const userABalance = await userA.pairToken.balanceOf(userA.address)
    expect(userABalance).to.be.equal(amountToWithdraw)
  })
})
