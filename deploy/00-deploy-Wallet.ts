import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { NetWorkInfo } from 'tasks'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { deploy, log } = deployments

  const { owner } = await getNamedAccounts()

  const {
    blockConfirmations,
    sushiSwapRouterAddress,
    sushiV2FactoryAddress,
    masterChefAddress,
    masterChefV2Address,
  }: NetWorkInfo = await hre.run('networkInfo')

  try {
    const deployResult = await deploy('SmartWallet', {
      from: owner,
      log: true,
      args: [sushiSwapRouterAddress, masterChefAddress, masterChefV2Address, sushiV2FactoryAddress],
      waitConfirmations: blockConfirmations,
      skipIfAlreadyDeployed: true,
    })

    if (deployResult.newlyDeployed) {
      log(
        `contract Wallet deployed at ${deployResult.address} using ${deployResult.receipt?.gasUsed} gas`,
      )
    }
  } catch (error) {
    console.error(error)
  }
}

export default func
func.tags = ['SmartWallet']
