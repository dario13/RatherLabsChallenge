import { BigNumber, ethers } from 'ethers'

const isValidAddress = (address: string): boolean => {
  return ethers.utils.isAddress(address)
}

/**
 * Given an array of addresses, if any of them are invalid, throw an error
 */
export const validateAddresses = (addresses: string[]): void => {
  addresses.forEach((address) => {
    if (!isValidAddress(address)) {
      throw new Error(`The address entered is invalid: ${address}`)
    }
  })
}

/**
 * Given two addresses, returns as addressA the address with the higher value, and as addressA the lower value
 */
export const sortAddresses = (
  addressA: string,
  addressB: string,
): { addressA: string; addressB: string } => {
  return BigNumber.from(addressA) > BigNumber.from(addressB)
    ? { addressA, addressB }
    : { addressA: addressB, addressB: addressA }
}
