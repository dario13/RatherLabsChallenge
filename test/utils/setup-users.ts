import { Contract } from 'ethers'
import { ethers } from 'hardhat'

/**
 * Given a list of named accounts and contracts, return a list of users with those contracts connected
 */
export async function setupNamedUsers<
  K extends { [accountName: string]: string },
  T extends { [contractName: string]: Contract },
>(accounts: K, contracts: T): Promise<Record<string, { address: string } & T>> {
  const users: Record<string, { address: string } & T> = {}

  for (const key in accounts) {
    users[key] = await setupUser(accounts[key], contracts)
  }

  return users
}

export async function setupUser<T extends { [contractName: string]: Contract }>(
  address: string,
  contracts: T,
): Promise<{ address: string } & T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = { address }
  for (const key of Object.keys(contracts)) {
    user[key] = contracts[key].connect(await ethers.getSigner(address))
  }
  return user as { address: string } & T
}
