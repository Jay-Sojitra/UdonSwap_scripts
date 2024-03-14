const ethers = require("ethers");
const fs = require("fs");
const path = require("path");


async function getERC20Tokens(address) {
    const apiUrl = `https://sepolia.explorer.mode.network/api/v2/addresses/${address}/tokens?type=ERC-20`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data || !data.items) {
            throw new Error('Invalid response from API');
        }

        const tokens = data.items.map(item => {
            const tokenInfo = item.token;
            return {
                address: tokenInfo.address,
                name: tokenInfo.name,
                symbol: tokenInfo.symbol,
                balance: item.value,
                decimals: tokenInfo.decimals
            };
        });

        return tokens;
    } catch (error) {
        console.error('Error fetching ERC20 tokens:', error);
        throw error;
    }
}
async function filterUniswapV2Tokens(tokens) {
    return tokens.filter(token => token.symbol === 'UNI-V2');
}

async function main() {
    const provider = new ethers.JsonRpcProvider("https://sepolia.mode.network");
    const accountAddress = "0xB4e6ee231C86bBcCB35935244CBE9cE333D30Bdf";
    const lpTokenAddress = "0x115253bcd7D2c7ca706ca8605eE4Fd7D5fCEEBA0";
    const pairABIPath = path.resolve(__dirname, "UniswapV2PairABI.json");
    const tokenABIPath = path.resolve(__dirname, "TokenABI.json");

    const erc20Tokens = await getERC20Tokens(accountAddress);
    const uniswapV2Tokens = await filterUniswapV2Tokens(erc20Tokens);

    console.log("Uniswap V2 Tokens:", uniswapV2Tokens);
    console.log("ERC20 Tokens owned by", accountAddress, ":", erc20Tokens);



}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
