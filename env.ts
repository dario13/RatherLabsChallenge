import * as dotenv from 'dotenv'
dotenv.config({ path: './.env' })

export const mainNetRpcUrl = process.env.MAINNET_RPC_URL!
export const forkingBlockNumber = process.env.FORKING_BLOCK_NUMBER!
export const theGraphApiKey = process.env.THEGRAPH_API_KEY!
