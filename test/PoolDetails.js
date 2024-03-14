// const { ethers } = require("hardhat");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");
const BigNumber = require('bignumber.js');

async function getAllPairs(factoryAddress, factoryABI, provider) {
    // const factory = await ethers.getContractAt(factoryABI, factoryAddress, provider);
    const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
    const allPairsLength = await factory.allPairsLength();
    const pairAddresses = [];
    for (let i = 0; i < allPairsLength; i++) {
        pairAddresses.push(await factory.allPairs(i));
    }
    return pairAddresses;
}

async function getPairDetails(pairAddress, pairABI, provider, tokenABI) {
    // const pair = await ethers.getContractAt(pairABI, pairAddress, provider);
    const pair = new ethers.Contract(pairAddress, pairABI, provider);
    // console.log('pair',pair);
    const [token0Address, token1Address, reserves] = await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.getReserves(),
    ]);

    const [reserve0, reserve1, blockTimestampLast] = reserves;

    const reserve0Normal = BigNumber(reserve0.toString()).dividedBy(BigNumber(10).pow(18)).toString(); // Assuming 18 decimals for token0
    const reserve1Normal = BigNumber(reserve1.toString()).dividedBy(BigNumber(10).pow(18)).toString(); // Assuming 18 decimals for token1

    // Get token details for token0
    const token0 = await getTokenDetails(token0Address, tokenABI, provider);

    // Get token details for token1
    const token1 = await getTokenDetails(token1Address, tokenABI, provider);

    return {
        pairAddress,
        token0,
        token1,
        reserves: {
            reserve0: reserve0Normal,
            reserve1: reserve1Normal,
            blockTimestampLast,
        },
    };
}

async function getTokenDetails(tokenAddress, tokenABI, provider) {
    // const token = await ethers.getContractAt(tokenABI, tokenAddress, provider);
    const token = new ethers.Contract(tokenAddress, tokenABI, provider);
    const [name, symbol] = await Promise.all([
        token.name(),
        token.symbol(),
    ]);
    return { address: tokenAddress, name, symbol };
}

async function getLpTokenDetails(accountAddress, lpTokenAddress, tokenABI, provider) {
    // Instantiate the ERC20 token contract
    const lpToken = new ethers.Contract(lpTokenAddress, tokenABI, provider);

    // Check the LP token balance of the account
    const lpTokenBalance = await lpToken.balanceOf(accountAddress);

    // If the LP token balance is greater than zero, return the ERC20 token instance
    if (lpTokenBalance > 0) {
        return lpToken;
    } else {
        throw new Error("The account does not hold any LP tokens for the provided LP token address.");
    }
}

async function getAllPairDetails(pairAddresses, pairABI, provider, tokenABI) {
    const pairData = [];
    for (const pairAddress of pairAddresses) {
        const pairInfo = await getPairDetails(pairAddress, pairABI, provider, tokenABI);
        pairData.push(pairInfo);
    }
    return pairData;
}

async function main() {

    const provider = new ethers.JsonRpcProvider("https://sepolia.mode.network");


    const factoryAddress = "0x2eeFa13703Eb4483Aa588Fd5D6bfb034E1FB8d97";
    const accountAddress = "0xB4e6ee231C86bBcCB35935244CBE9cE333D30Bdf";
    const lpTokenAddress = "0x115253bcd7D2c7ca706ca8605eE4Fd7D5fCEEBA0";


    const factoryABIPath = path.resolve(__dirname, "UniswapV2FactoryABI.json");
    const pairABIPath = path.resolve(__dirname, "UniswapV2PairABI.json");
    const tokenABIPath = path.resolve(__dirname, "TokenABI.json");

    // Read ABIs from files
    const factoryABI = JSON.parse(fs.readFileSync(factoryABIPath));
    const pairABI = JSON.parse(fs.readFileSync(pairABIPath));
    const tokenABI = JSON.parse(fs.readFileSync(tokenABIPath));

    const pairAddresses = await getAllPairs(factoryAddress, factoryABI, provider);
    const allPairDetails = await getAllPairDetails(pairAddresses, pairABI, provider, tokenABI);

    const lpTokenInstance = await getLpTokenDetails(accountAddress, lpTokenAddress, pairABI, provider);

    // Now you can use the methods of the ERC20 token instance
    // const lpTokenName = await lpTokenInstance.name();
    // const lpTokenSymbol = await lpTokenInstance.symbol();
    // const lpTokenDecimals = await lpTokenInstance.decimals();
    // const PERMIT_TYPEHASH = await lpTokenInstance.PERMIT_TYPEHASH();
    const token0 = await lpTokenInstance.token0();
    // You can use other ERC20 token methods as needed

    // console.log("LP Token Name:", lpTokenName);
    // console.log("LP Token Symbol:", lpTokenSymbol);
    // console.log("LP Token Decimals:", lpTokenDecimals);
    // console.log("PERMIT_TYPEHASH:", PERMIT_TYPEHASH);
    console.log('token0->', token0);


    console.log("All Pair Data:");
    allPairDetails.forEach((pair) => {
        console.log("Pair Address:", pair.pairAddress);
        console.log("Token0:", pair.token0);
        console.log("Token1:", pair.token1);
        console.log("Reserves:", pair.reserves);
        console.log("---------------------");
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
