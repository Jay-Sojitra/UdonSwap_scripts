require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",

  networks: {
    mode: {
      url: process.env.MODE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
};
//npx hardhat run --network mode test/PoolDetails.js
//https://sepolia.mode.network
