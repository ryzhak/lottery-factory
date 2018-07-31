require("./utils/helpers.js");

const LotteryFactoryTestable = artifacts.require("LotteryFactoryTestable");

const LOTTERY_INDEX_TOKEN_COUNT_TO_SELL = 2;

contract("LotteryFactoryTestable", (accounts) => {

	let factory;

	beforeEach(async () => {
		factory = await LotteryFactoryTestable.new();
	});

	describe("buyTokensFromSeller", () => {

		it("should throw if token count to buy <= 0", async () => {
			await factory.buyTokensFromSeller(0).should.be.rejectedWith("revert");
		});
	});

	describe("transferFrom", () => {

		const tokenId = 0;

		beforeEach(async() => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;
		});

		it("should remove token id from owner tokens", async () => {
			const balanceBefore = await factory.balanceOf(accounts[0]);
			assert.equal(balanceBefore, 1);

			await factory.transferFrom(accounts[0], accounts[1], tokenId);

			const balanceAfter = await factory.balanceOf(accounts[0]);
			assert.equal(balanceAfter, 0);
		});

		it("should substitute 1 from owner's selling tokens count", async () => {
			const balanceSellingBefore = await factory.balanceSellingOf(accounts[0]);
			assert.equal(balanceSellingBefore, 1);

			await factory.transferFrom(accounts[0], accounts[1], tokenId);

			const balanceSellingAfter = await factory.balanceOf(accounts[0]);
			assert.equal(balanceSellingAfter, 0);
		});

		it("should update token owner", async () => {
			const ownerBefore = await factory.ownerOf(tokenId);
			assert.equal(ownerBefore, accounts[0]);

			await factory.transferFrom(accounts[0], accounts[1], tokenId);

			const ownerAfter = await factory.ownerOf(tokenId);
			assert.equal(ownerAfter, accounts[1]);
		});

		it("should add token id to new owner's tokens", async () => {
			const tokensBefore = await factory.tokensOf(accounts[1]);
			assert.equal(tokensBefore.length, 0);

			await factory.transferFrom(accounts[0], accounts[1], tokenId);

			const tokensAfter = await factory.tokensOf(accounts[1]);
			assert.equal(tokensAfter.length, 1);
			assert.equal(tokensAfter[0].toNumber(), 0);
		});

		it("should set token selling state to false", async () => {
			const sellingBefore = await factory.isTokenSelling(tokenId);
			assert.isTrue(sellingBefore);

			await factory.transferFrom(accounts[0], accounts[1], tokenId);

			const sellingAfter = await factory.isTokenSelling(tokenId);
			assert.isFalse(sellingAfter);
		});

		it("should substitute 1 from total tokens count on sale", async () => {
			let lottery = await factory.getLotteryAtIndex(0);
			assert.equal(lottery[LOTTERY_INDEX_TOKEN_COUNT_TO_SELL].toNumber(), 1);

			await factory.transferFrom(accounts[0], accounts[1], tokenId);

			lottery = await factory.getLotteryAtIndex(0);
			assert.equal(lottery[LOTTERY_INDEX_TOKEN_COUNT_TO_SELL].toNumber(), 0);
		});
	});

});