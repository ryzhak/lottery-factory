const LotteryFactory = artifacts.require("LotteryFactory");

contract("LotteryFactory", (accounts) => {

	let lotteryFactory;

	beforeEach(async () => {
		lotteryFactory = await LotteryFactory.new();
	});

	it("test", async () => {
		await lotteryFactory.buyTokens({value: web3.toWei("1", "ether"), from: accounts[0]});
		//await lotteryFactory.approveToSell(1);
		await lotteryFactory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[1]});
		//await lotteryFactory.buyTokens({value: web3.toWei("2", "ether"), from: accounts[1]});

		let lotteryCount = await lotteryFactory.lotteryCount();
		let a = await lotteryFactory.getLotteryAtIndex(lotteryCount - 1);
		console.log(a);
		
		// await lotteryFactory.disapproveToSell(100);
		// a = await lotteryFactory.getLotteryAtIndex(lotteryCount - 1);
		// console.log(a);

		//let b = await lotteryFactory.balanceOf(accounts[0]);
		//console.log(b.toNumber());
		
	});

});