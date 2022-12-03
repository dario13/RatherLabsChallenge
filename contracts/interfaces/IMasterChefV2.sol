// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IMasterChefV2 {
    function deposit(uint256 pid, uint256 amount, address to) external;

    function withdraw(uint256 pid, uint256 amount, address to) external;

    function lpToken(uint index) external view returns (address);

    function poolLength() external view returns (uint256 pools);
}
