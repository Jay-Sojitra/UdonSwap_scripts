// const { ethers } = require("hardhat");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

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
    const [token0Address, token1Address, reserves] = await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.getReserves(),
    ]);

    // Get token details for token0
    const token0 = await getTokenDetails(token0Address, tokenABI, provider);

    // Get token details for token1
    const token1 = await getTokenDetails(token1Address, tokenABI, provider);

    return {
        pairAddress,
        token0,
        token1,
        reserves,
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

async function getAllPairDetails(pairAddresses, pairABI, provider, tokenABI) {
    const pairData = [];
    for (const pairAddress of pairAddresses) {
        const pairInfo = await getPairDetails(pairAddress, pairABI, provider, tokenABI);
        pairData.push(pairInfo);
    }
    return pairData;
}

async function main() {

    // const provider = new ethers.providers.JsonRpcProvider("https://sepolia.mode.network");
    const provider = new ethers.JsonRpcProvider("https://sepolia.mode.network");


    const factoryAddress = "0x2eeFa13703Eb4483Aa588Fd5D6bfb034E1FB8d97";
    const factoryABIPath = path.resolve(__dirname, "UniswapV2FactoryABI.json");
    const pairABIPath = path.resolve(__dirname, "UniswapV2PairABI.json");
    const tokenABIPath = path.resolve(__dirname, "TokenABI.json");

    // Read ABIs from files
    const factoryABI = JSON.parse(fs.readFileSync(factoryABIPath));
    const pairABI = JSON.parse(fs.readFileSync(pairABIPath));
    const tokenABI = JSON.parse(fs.readFileSync(tokenABIPath));

    const pairAddresses = await getAllPairs(factoryAddress, factoryABI, provider);
    const allPairDetails = await getAllPairDetails(pairAddresses, pairABI, provider, tokenABI);

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
