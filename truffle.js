const HDWalletProvider = require("truffle-hdwallet-provider");

require('dotenv').config();

module.exports = {
	networks: {
		development: {
			host: "127.0.0.1",
			port: 8545,
			network_id: "*" // Match any network id
		},
		main: {
			provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY),
			network_id: 1
		},
		ropsten: {
			provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY),
			network_id: 3
		},
		kovan: {
			provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY),
			network_id: 42
		},
		rinkeby: {
			provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://rinkeby.infura.io/v3/" + process.env.INFURA_API_KEY),
			network_id: 4
		}
	}
};