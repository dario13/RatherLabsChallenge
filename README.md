## Table of content

- [Challenge](#challenge)

- [Project Structure](#project-structure)

- [How it works](#about-the-game)

- [Installation](#installation)

- [Running the project](#running-the-project)

- [Running tests](#running-the-tests)

- [Running Slither](#running-slither)

- [Considerations](#considerations)

## Challenge

SushiSwap is a decentralized exchange (DEX) protocol based off Uniswap.
To compete with its predecessor, SushiSwap launched a liquidity mining
program that rewards liquidity providers that decide to deposit their tokens
on their DEX.
In order to participate for the liquidity program, you have to follow the
following steps

- Approve the SushiSwap router to use your tokens.
- Provide liquidity on SushiSwap by entering a pool using that is
  incentivized by Sushi (https://app.sushi.com/pool).
- Approve the MasterChef smart contract to use your tokens.
- Deposit the liquidity token (SLP) you received after supplying
  liquidity into a yield farm managed by MasterChef smart
  contract (https://app.sushi.com/yield), and earn SUSHI.

The usual process for joining the liquidity mining program consist of 4 steps.
This can be tiresome and consume a lot of time and extra gas.
Develop a smart contract that acts as a wallet, that encapsulates all the
actions required to join.
SushiSwap’s liquidity mining program into a single, handy transaction.
This should work with MasterChefV1 and MasterChefV2 and with any pair of
tokens.

## Project Structure

The project is divided into 5 main folders:

1 - **contracts**: contains the smart contracts and interfaces of the project.\
2 - **deploy**: contains the scripts to deploy the contracts.\
3 - **tasks**: contains the scripts to interact with the contracts and The Graph.\
4 - **test**: contains the tests of the project.\
5 - **utils**: contains utility functions consumed by other scripts

## How it works

![Alt text](/Diagram.png?raw=true 'Diagram')

The logic of the main SmartWallet function, called joinLiquidityMiningProgram(...) is:\
1- The user allows the SmartWallet to spend his tokens.\
2- The SmartWallet transfer the tokens from the user and allows the Router to spend his tokens. After that, call the Router to make a deposit in the Liquidty Pool.\
3- The Router performs a series of validations, and if everything is correct, add liquidity in the Liquidity Pool and transfers the minted SLP tokens to SmartWallet.\
4- The SmartWallet allows the MasterChef to spend his SLP tokens. After that, call the MasterChef to make a deposit in the MasterChef.\

## Installation

First clone the repository:

```bash
git clone https://github.com/dario13/RatherLabsChallenge.git
```

To intall the project, I recommend using Yarn, but you can use NPM if you prefer (I didn't prove it).

```bash
yarn install
```

## Running the project

To run the project, both for tasks and for tests, it's necessary to run a local Ethereum network node because the project uses a fork of the Ethereum mainnet. Execute the following command to run the node:

```bash
yarn hardhat node
```

In a potential dapp, the user would obtain the information of the tokens and the pools on a frontend, but for simplicity I created two tasks to obtain that information. \
The first task gets the information totally on-chain. Execute the following command example to run the task:

```bash
yarn hardhat getPIDonchain --token0 '0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5' --token1 '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' --network localhost
```

Should print something like this:

```bash
Pair Token address:  0x269Db91Fc3c7fCC275C2E6f22e5552504512811c
Pool found in both MasterChefV1 and MasterChefV2
Pool ID found in MasterChefV1:  35
Pool ID found in MasterChefV2:  3
```

The second task gets the information from The Graph. Execute the following command example to run the task:

```bash
yarn hardhat getPID --token0 '0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5' --token1 '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' --network localhost
```

and should print something like this:

```bash
------------------------------------
Token0: 0x429881672B9AE42b8EbA0E26cD9C73711b891Ca5
Token1: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
Pair Address: 0x269db91fc3c7fcc275c2e6f22e5552504512811c
------------------------------------
Pool Information:  [
  {
    pairAddress: '0x269db91fc3c7fcc275c2e6f22e5552504512811c',
    pid: '35',
    version: 'MASTERCHEF'
  },
  {
    pairAddress: '0x269db91fc3c7fcc275c2e6f22e5552504512811c',
    pid: '3',
    version: 'MASTERCHEFV2'
  }
]
```

## Running tests

To run the tests, you can use the following command:

```bash
 yarn test
```

## Running Slither

For running Slither, I use a docker image, you can run this command to get the image:

```bash
docker pull trailofbits/eth-security-toolbox
```

\
 Then you need to run the following command:

```bash
yarn toolbox
```

\
 And inside the container, you can run slither as follows:\
 First, changing solc version to 0.8.13:

```bash
solc-select use 0.8.13
```

And finally running slither:

```bash
slither /src/contracts/ --solc-remaps '@openzeppelin=/src/node_modules/@openzeppelin @chainlink=/src/node_modules/@chainlink' --exclude naming-convention,external-function,low-level-calls
```

The analysis will indicate that the contract has a reentrancy vulnerability, and it's true because the token balance, line 220 and 221, is updated after to add liquidity, because the exact amount that was debited is informed when the liquidity is added. This calculation could be done previously for the contract, copying the logic applied in the internal function \_addLiquidity from the router, but in order not to prolong the delivery of this challenge I decided to leave it as it is.

## Considerations

About the contract:

- The SLP Token address is required to join the liquidity mining program, because it's understood that the user is only interested in joining the program for pairs who are already in the pool and eligible to be farmed.
- Some validations are not performed in the SmartWallet, such as if the SLP doesn't exist in the MasterChef, because it wouldn't be listed in a potential frontend.
- The SmartWallet is not a proxy contract, because it's not required for this challenge, but could easily be adapted.
- With more time, possibly gas used could be improved
- Only Slither was used for the analysis, but other tools for vulnerability analysis should be used.

About the tests:

- The tests were only done for the forked network, because I didn't find a testnet for SushiSwap.
- Only positive scenarios have been tested, but other scenarios should also be tested in a real implementation. Moreover, fuzz tests should be added.
- I didn't use mocks because I found it better to use real contracts.

And finally:

- Many other implementations could be done for this project, like a frontend in React, a CI/CD pipeline, etc. I have a project with the same stack in which I have implemented these things: https://github.com/dario13/MOM_Project
