import { HardhatUserConfig } from 'hardhat/config'
import '@typechain/hardhat'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-ethers'
import './tasks'
import { forkingBlockNumber, mainNetRpcUrl } from './env'

const config: HardhatUserConfig = {
  namedAccounts: {
    owner: 0,
    userA: 1,
    userB: 2,
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: mainNetRpcUrl,
        blockNumber: Number(forkingBlockNumber),
        enabled: true,
      },
    },
    localhost: {
      chainId: 31337,
      timeout: 2000000,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.13',
      },
      { version: '0.6.12' },
    ],
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v5',
  },
}

export default config
