// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/ISushiSwapRouter.sol';
import './interfaces/IMasterChefV1.sol';
import './interfaces/IMasterChefV2.sol';
import './interfaces/IUniswapV2Factory.sol';
import {IncorrectAllowanceProvided, InsufficientSlpBalance} from './Errors.sol';

contract SmartWallet is Ownable {
    using SafeERC20 for IERC20;
    ISushiSwapRouter public sushiSwapRouter;
    IMasterChefV1 public masterChefV1;
    IMasterChefV2 public masterChefV2;
    IUniswapV2Factory public uniswapV2Factory;
    struct Farm {
        address slpToken;
        bool isMasterChefV2;
        uint32 pid;
        uint256 amount;
    }
    // Farms of each user
    mapping(address => Farm[]) public farms;
    // Tokens balance of each user
    mapping(address => mapping(address => uint256)) public tokensBalance;
    // Events
    event FarmingIn(address indexed user, address indexed slpToken, uint256 amount);
    event FarmingOut(address indexed user, address indexed slpToken, uint256 amount);

    constructor(
        address _sushiSwapRouter,
        address _masterChefV1,
        address _masterChefV2,
        address _uniswapV2Factory
    ) {
        sushiSwapRouter = ISushiSwapRouter(_sushiSwapRouter);
        masterChefV1 = IMasterChefV1(_masterChefV1);
        masterChefV2 = IMasterChefV2(_masterChefV2);
        uniswapV2Factory = IUniswapV2Factory(_uniswapV2Factory);
    }

    // Given a token and an amount, checks if the user has approved this contract to spend the token
    function _checkAllowance(address _token, uint256 _amount) private view {
        uint256 provided = IERC20(_token).allowance(address(msg.sender), address(this));
        if (provided < _amount) revert IncorrectAllowanceProvided(provided, _amount);
    }

    // Deposits a token into this contract
    function _depositToken(address _token, uint256 _amount) private {
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        // Update user token balance
        tokensBalance[msg.sender][_token] += _amount;
    }

    // Add liquidity to SushiSwap
    function _addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountA,
        uint256 _amountB,
        uint256 _amountAMin,
        uint256 _amountBMin,
        uint256 _deadline
    ) private returns (uint256 amountA, uint256 amountB, uint256 providedLiquidity) {
        (amountA, amountB, providedLiquidity) = sushiSwapRouter.addLiquidity(
            _tokenA,
            _tokenB,
            _amountA,
            _amountB,
            _amountAMin,
            _amountBMin,
            address(this),
            _deadline
        );
    }

    // Get user SLP token balance
    function getSLPBalance(
        address _user,
        address _slpToken,
        bool _isMasterChefV2,
        uint32 _pid
    ) public view returns (uint256 balance) {
        Farm[] memory userFarms = farms[_user];
        for (uint256 i = 0; i < userFarms.length; i++) {
            if (
                userFarms[i].slpToken == _slpToken &&
                userFarms[i].isMasterChefV2 == _isMasterChefV2 &&
                userFarms[i].pid == _pid
            ) {
                balance = userFarms[i].amount;
                break;
            }
        }
    }

    // Increments user's farm balance, if the farm doesn't exist, creates it
    function _incrementFarmBalance(
        address _user,
        address _slpToken,
        bool _isMasterChefV2,
        uint32 _pid,
        uint256 _amount
    ) private {
        Farm[] memory userFarms = farms[_user];
        bool farmExists = false;
        for (uint256 i = 0; i < userFarms.length; i++) {
            if (
                userFarms[i].slpToken == _slpToken &&
                userFarms[i].isMasterChefV2 == _isMasterChefV2 &&
                userFarms[i].pid == _pid
            ) {
                userFarms[i].amount += _amount;
                farmExists = true;
                break;
            }
        }
        if (!farmExists) {
            Farm memory newFarm = Farm(_slpToken, _isMasterChefV2, _pid, _amount);
            farms[_user].push(newFarm);
        }
    }

    // Decrements user's farm balance
    function _decrementFarmBalance(
        address _user,
        address _slpToken,
        bool _isMasterChefV2,
        uint32 _pid,
        uint256 _amount
    ) private view {
        Farm[] memory userFarms = farms[_user];
        for (uint256 i = 0; i < userFarms.length; i++) {
            if (
                userFarms[i].slpToken == _slpToken &&
                userFarms[i].isMasterChefV2 == _isMasterChefV2 &&
                userFarms[i].pid == _pid
            ) {
                userFarms[i].amount -= _amount;
                break;
            }
        }
    }

    // Approve MasterChefV1 or V2 to spend the SLP token
    function _approveMasterChef(address _slpToken, uint256 _amount, bool _isMasterChefV2) private {
        if (_isMasterChefV2) {
            IERC20(_slpToken).safeApprove(address(masterChefV2), _amount);
        } else {
            IERC20(_slpToken).safeApprove(address(masterChefV1), _amount);
        }
    }

    // Approve SushiSwapRouter to spend the token
    function _approveSushiSwapRouter(address _token, uint256 _amount) private {
        IERC20(_token).safeApprove(address(sushiSwapRouter), _amount);
    }

    // Deposit SLP tokens into MasterChefV1 or V2
    function _depositSLP(uint256 _amount, bool _isMasterChefV2, uint32 _pid) private {
        if (_isMasterChefV2) {
            masterChefV2.deposit(_pid, _amount, address(this));
        } else {
            masterChefV1.deposit(_pid, _amount);
        }
    }

    // Retrieve info about a user's farms
    function getFarmInfo(address _user) public view returns (Farm[] memory) {
        return farms[_user];
    }

    function joinLiquidityMiningProgram(
        address _tokenA,
        address _tokenB,
        uint256 _amountA,
        uint256 _amountB,
        uint256 _amountAMin,
        uint256 _amountBMin,
        uint256 _deadline,
        uint32 _pid,
        address _slpTokenAddress,
        bool _isMasterChefV2
    ) public {
        // Check if the allowance is correct
        _checkAllowance(_tokenA, _amountA);
        _checkAllowance(_tokenB, _amountB);

        // Deposit the tokens into this contract
        _depositToken(_tokenA, _amountA);
        _depositToken(_tokenB, _amountB);

        // Approve SushiSwapRouter to spend the tokens
        _approveSushiSwapRouter(_tokenA, _amountA);
        _approveSushiSwapRouter(_tokenB, _amountB);

        // Add liquidity to SushiSwap
        (uint256 amountA, uint256 amountB, uint256 providedLiquidity) = _addLiquidity(
            _tokenA,
            _tokenB,
            _amountA,
            _amountB,
            _amountAMin,
            _amountBMin,
            _deadline
        );

        // Update tokens balance
        tokensBalance[msg.sender][_tokenA] -= amountA;
        tokensBalance[msg.sender][_tokenB] -= amountB;

        // Approve the MasterChef to spend the SLP tokens
        _approveMasterChef(_slpTokenAddress, providedLiquidity, _isMasterChefV2);

        // Deposit SLP tokens
        _depositSLP(providedLiquidity, _isMasterChefV2, _pid);

        // Update user farm info
        _incrementFarmBalance(
            msg.sender,
            _slpTokenAddress,
            _isMasterChefV2,
            _pid,
            providedLiquidity
        );

        // Emit event
        emit FarmingIn(msg.sender, _slpTokenAddress, providedLiquidity);
    }

    // Withdraw the user's tokens, which were left over when liquidity was added to a pool
    function withdrawTokens(address[] memory _tokenAddresses) external {
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            address tokenAddress = _tokenAddresses[i];
            uint256 amount = tokensBalance[msg.sender][tokenAddress];
            tokensBalance[msg.sender][tokenAddress] = 0;
            IERC20(tokenAddress).safeTransfer(msg.sender, amount);
        }
    }

    // Withdraw SLP tokens from MasterChefV1 or V2 to user's wallet
    function withdrawSLP(
        uint256 _amount,
        bool _isMasterChefV2,
        uint32 _pid,
        address _slpTokenAddress
    ) external {
        // Validate if the user has enough SLP tokens
        uint slpBalance = getSLPBalance(msg.sender, _slpTokenAddress, _isMasterChefV2, _pid);
        if (_amount > slpBalance) {
            revert InsufficientSlpBalance(slpBalance, _amount);
        }

        // Update user farm info
        _decrementFarmBalance(msg.sender, _slpTokenAddress, _isMasterChefV2, _pid, _amount);

        if (_isMasterChefV2) {
            masterChefV2.withdraw(_pid, _amount, msg.sender);
        } else {
            masterChefV1.withdraw(_pid, _amount);
            // transfer SLP tokens to user's wallet
            IERC20(_slpTokenAddress).safeTransfer(msg.sender, _amount);
        }

        // Emit event
        emit FarmingOut(msg.sender, _slpTokenAddress, _amount);
    }
}
