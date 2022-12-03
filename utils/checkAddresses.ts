import { ethers } from 'ethers'

const isValidAddress = (address: string): boolean => {
  return ethers.utils.isAddress(address)
}

export const checkAddresses = (addresses: string[]): void => {
  addresses.forEach((address) => {
    if (!isValidAddress(address)) {
      throw new Error(`The address entered is invalid: ${address}`)
    }
  })
}
