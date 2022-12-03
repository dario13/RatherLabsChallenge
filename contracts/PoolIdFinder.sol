// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import './interfaces/IMasterChefV1.sol';
import './interfaces/IMasterChefV2.sol';
import './interfaces/IUniswapV2Factory.sol';

contract PoolIdFinder {
    IMasterChefV1 public masterChefV1;
    IMasterChefV2 public masterChefV2;
    IUniswapV2Factory public uniswapV2Factory;
    enum MasterChefVersionFound {
        V1,
        V2,
        Both,
        None
    }

    constructor(address _masterChefV1, address _masterChefV2, address _uniswapV2Factory) {
        masterChefV1 = IMasterChefV1(_masterChefV1);
        masterChefV2 = IMasterChefV2(_masterChefV2);
        uniswapV2Factory = IUniswapV2Factory(_uniswapV2Factory);
    }

    // Given the address of tokenA and tokenB, returns the address of the SLP token
    function getSLPTokenAddress(
        address _tokenA,
        address _tokenB
    ) public returns (address slpTokenAddress) {
        slpTokenAddress = uniswapV2Factory.getPair(_tokenA, _tokenB);

        if (slpTokenAddress == address(0)) {
            return uniswapV2Factory.createPair(_tokenA, _tokenB);
        }
    }

    // Given a SLP token address, returns the poolId in MasterChefV2
    function _findPoolIdInMasterChefV2(
        address _slpToken
    ) private view returns (uint32 poolId, bool found) {
        for (uint32 i = 0; i < masterChefV2.poolLength(); i++) {
            if (masterChefV2.lpToken(i) == _slpToken) {
                return (i, true);
            }
        }
        return (0, false);
    }

    // Given a SLP token address, returns the poolId in MasterChefV1
    function _findPoolIdInMasterChefV1(
        address _slpToken
    ) private view returns (uint32 poolId, bool found) {
        for (uint32 i = 0; i < masterChefV1.poolLength(); i++) {
            if (address(masterChefV1.poolInfo(i).lpToken) == _slpToken) {
                return (i, true);
            }
        }
        return (0, false);
    }

    // Given a SLP token address, returns the poolId in MasterChefV1 and MasterChefV2 if it exists in either of them.
    // Also returns the MasterChef version where the poolId was found.
    function getPoolIdAndMasterChefVersion(
        address _slpToken
    )
        public
        view
        returns (
            uint32 poolIdInMasterChefV1,
            uint32 poolIdInMasterChefV2,
            MasterChefVersionFound masterChefVersionFound
        )
    {
        (uint32 pidInV1, bool foundInMasterChefV1) = _findPoolIdInMasterChefV1(_slpToken);
        (uint32 pidInV2, bool foundInMasterChefV2) = _findPoolIdInMasterChefV2(_slpToken);

        if (foundInMasterChefV1 && foundInMasterChefV2) {
            masterChefVersionFound = MasterChefVersionFound.Both;
        } else if (foundInMasterChefV1) {
            masterChefVersionFound = MasterChefVersionFound.V1;
        } else if (foundInMasterChefV2) {
            masterChefVersionFound = MasterChefVersionFound.V2;
        } else {
            masterChefVersionFound = MasterChefVersionFound.None;
        }

        return (pidInV1, pidInV2, masterChefVersionFound);
    }
}
