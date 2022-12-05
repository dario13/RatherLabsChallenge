import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment, TaskArguments } from 'hardhat/types'
import { networkConfig, NetworkConfigItem } from '../helper-hardhat-config'

export type NetWorkInfo = {
  isLocalHost: boolean
  chainId: number
} & NetworkConfigItem

task(
  'networkInfo',
  'Returns all the information about the chosen network',
  async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<NetWorkInfo> => {
    const chainId: string | undefined = await hre.getChainId()

    const config = networkConfig[chainId]

    if (!chainId) {
      throw new Error('Chain id not specified')
    }
    const isLocalHost: boolean = hre.network.name === 'localhost'

    return {
      isLocalHost,
      chainId: Number(chainId),
      ...config,
    }
  },
)
