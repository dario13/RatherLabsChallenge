export type NetworkConfigItem = {
  networkName: string
  blockConfirmations: number
  ownerAddress?: string
  sushiV2FactoryAddress?: string
  sushiSwapRouterAddress?: string
  masterChefAddress?: string
  masterChefV2Address?: string
}

type NetworkConfigMap = {
  [chainId: string]: NetworkConfigItem
}

export const networkConfig: NetworkConfigMap = {
  default: {
    networkName: 'hardhat',
    blockConfirmations: 1,
  },
  31337: {
    networkName: 'localhost',
    blockConfirmations: 1,
    ownerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    sushiV2FactoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
    sushiSwapRouterAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    masterChefAddress: '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd',
    masterChefV2Address: '0xef0881ec094552b2e128cf945ef17a6752b4ec5d',
  },
}
