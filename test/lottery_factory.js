const { increaseTime } = require("./utils/helpers");

const LotteryFactoryTestable = artifacts.require("LotteryFactoryTestable");

const LOTTERY_INDEX_TOKEN_COUNT_TO_SELL = 2;
const LOTTERY_INDEX_PARAM_GAME_DURATION = 7;
const LOTTERY_INDEX_PARAM_INITIAL_TOKEN_PRICE = 8;
const LOTTERY_INDEX_PARAM_DURATION_TO_TOKEN_PRICE_UP = 9;
const LOTTERY_INDEX_PARAM_TOKEN_PRICE_INCREASE_PERCENT = 10;
const LOTTERY_INDEX_PARAM_TRADE_COMMISSION = 11;
const LOTTERY_INDEX_PARAM_WINNER_COMMISSION = 12;

contract("LotteryFactoryTestable", (accounts) => {

	let factory;

	beforeEach(async () => {
		factory = await LotteryFactoryTestable.new();
	});

	describe("approveToSell", () => {

		it("should throw if user has not enough tokens to sell", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(2).should.be.rejectedWith("revert");
		});

		it("should increase user's token amount to sell", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;

			const balanceBeforeApprove = await factory.balanceSellingOf(accounts[0])
			assert.equal(balanceBeforeApprove.toNumber(), 0);

			await factory.approveToSell(1).should.be.fulfilled;

			const balanceAfterApprove = await factory.balanceSellingOf(accounts[0])
			assert.equal(balanceAfterApprove.toNumber(), 1);
		});
	});

	describe("balanceOf", () => {

		it("should return user balance", async () => {
			const balanceBefore = await factory.balanceOf(accounts[0]);
			assert.equal(balanceBefore.toNumber(), 0);

			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			
			const balanceAfter = await factory.balanceOf(accounts[0]);
			assert.equal(balanceAfter.toNumber(), 1);
		});
	});

	describe("balanceSellingOf", () => {

		it("should return user selling balance", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;

			const balanceBefore = await factory.balanceSellingOf(accounts[0]);
			assert.equal(balanceBefore.toNumber(), 0);

			await factory.approveToSell(1).should.be.fulfilled;
			
			const balanceAfter = await factory.balanceSellingOf(accounts[0]);
			assert.equal(balanceAfter.toNumber(), 1);
		});
	});

	describe("buyTokens", () => {

		it("should buy tokens", async () => {
			const balanceUser1Before = await factory.balanceOf(accounts[0]);
			assert.equal(balanceUser1Before.toNumber(), 0);
			const balanceUser2Before = await factory.balanceOf(accounts[1]);
			assert.equal(balanceUser2Before.toNumber(), 0);

			// user 1 buys 1 token
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			// user 2 buys 2 tokens
			await factory.buyTokens({value: web3.toWei("0.02", "ether"), from: accounts[1]}).should.be.fulfilled;

			const balanceUser1After = await factory.balanceOf(accounts[0]);
			assert.equal(balanceUser1After.toNumber(), 1);
			const balanceUser2After = await factory.balanceOf(accounts[1]);
			assert.equal(balanceUser2After.toNumber(), 2);

			// user 1 approves to sell 1 token
			await factory.approveToSell(1, {from: accounts[0]});
			// user 2 approves to sell 1 token
			await factory.approveToSell(1, {from: accounts[1]});

			// user 3 buys 3 tokens, 2 from sellers and 1 from system
			await factory.buyTokens({value: web3.toWei("0.03", "ether"), from: accounts[2]}).should.be.fulfilled;

			const balanceUser1 = await factory.balanceOf(accounts[0]);
			assert.equal(balanceUser1.toNumber(), 0);
			const balanceUser2 = await factory.balanceOf(accounts[1]);
			assert.equal(balanceUser2.toNumber(), 1);
			const balanceUser3 = await factory.balanceOf(accounts[2]);
			assert.equal(balanceUser3.toNumber(), 3);
		});
	});

	describe("buyTokensFromSeller", () => {

		it("should throw if token count to buy <= 0", async () => {
			await factory.buyTokensFromSeller(0).should.be.rejectedWith("revert");
		});
	});

	describe("disapproveToSell", () => {

		it("should throw if user has not enough tokens to disapprove selling", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;
			await factory.approveToSell(2).should.be.rejectedWith("revert");
		});

		it("should decrease user's token amount to sell", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;

			const balanceBeforeDisapprove = await factory.balanceSellingOf(accounts[0])
			assert.equal(balanceBeforeDisapprove.toNumber(), 1);

			await factory.disapproveToSell(1).should.be.fulfilled;

			const balanceAfterDisapprove = await factory.balanceSellingOf(accounts[0])
			assert.equal(balanceAfterDisapprove.toNumber(), 0);
		});
	});

	describe("getCurrentTokenPrice", () => {

		it("should return correct price on different stages", async () => {
			const lottery = await factory.getLotteryAtIndex(0);
			const paramInitialTokenPrice = lottery[LOTTERY_INDEX_PARAM_INITIAL_TOKEN_PRICE].toNumber();
			const paramDurationToTokenPriceUp = lottery[LOTTERY_INDEX_PARAM_DURATION_TO_TOKEN_PRICE_UP].toNumber();
			const paramTokenPriceIncreasePercent = lottery[LOTTERY_INDEX_PARAM_TOKEN_PRICE_INCREASE_PERCENT].toNumber();
			
			// stage 1
			const priceStage1 = await factory.getCurrentTokenPrice();
			assert.equal(priceStage1.toNumber(), paramInitialTokenPrice);

			// stage 2
			increaseTime(paramDurationToTokenPriceUp);
			const priceStage2 = await factory.getCurrentTokenPrice();
			assert.equal(priceStage2.toNumber(), +priceStage1 + (paramTokenPriceIncreasePercent / 100) * priceStage1);

			// stage 3
			increaseTime(paramDurationToTokenPriceUp);
			const priceStage3 = await factory.getCurrentTokenPrice();
			assert.equal(priceStage3.toNumber(), +priceStage2 + (paramTokenPriceIncreasePercent / 100) * priceStage2);
		});
	});

	describe("isTokenSelling", () => {

		it("return false if token is not on sale", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			const isSelling = await factory.isTokenSelling(0);
			assert.isFalse(isSelling);
		});

		it("return true if token is on sale", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;
			const isSelling = await factory.isTokenSelling(0);
			assert.isTrue(isSelling);
		});
	});

	describe("ownerOf", () => {

		it("returns owner address of the token", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			const owner = await factory.ownerOf(0);
			assert.equal(owner, accounts[0]);
		});
	});

	describe("tokensOf", () => {

		it("returns array with token ids for user", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			const tokens = await factory.tokensOf(accounts[0]);
			assert.equal(tokens.length, 1);
			assert.equal(tokens[0].toNumber(), 0);
		});
	});

	describe("tokensToSellOnce", () => {

		it("returns array of tokens that were once placed on sale", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;
			const tokens = await factory.tokensToSellOnce();
			assert.equal(tokens.length, 1);
			assert.equal(tokens[0].toNumber(), 0);
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

	describe("updateParams", () => {

		it("should update params for next lottery", async () => {
			await factory.updateParams(1, 2, 3, 4, 5, 6).should.be.fulfilled;
			
			// create lottery #2
			await factory.createNewLottery();

			const lottery = await factory.getLotteryAtIndex(1);
			
			assert.equal(lottery[LOTTERY_INDEX_PARAM_GAME_DURATION].toNumber(), 1);
			assert.equal(lottery[LOTTERY_INDEX_PARAM_INITIAL_TOKEN_PRICE].toNumber(), 2);
			assert.equal(lottery[LOTTERY_INDEX_PARAM_DURATION_TO_TOKEN_PRICE_UP].toNumber(), 3);
			assert.equal(lottery[LOTTERY_INDEX_PARAM_TOKEN_PRICE_INCREASE_PERCENT].toNumber(), 4);
			assert.equal(lottery[LOTTERY_INDEX_PARAM_TRADE_COMMISSION].toNumber(), 5);
			assert.equal(lottery[LOTTERY_INDEX_PARAM_WINNER_COMMISSION].toNumber(), 6);
		});
	});

	describe("withdraw", () => {

		it("should withdraw commission sum to the owner", async () => {
			// user1 buys 10 tokens and approves them for sale
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(10, {from: accounts[0]}).should.be.fulfilled;
			// user2 buys 10 tokens and increases contract's commision sum
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[1]}).should.be.fulfilled;

			const balanceBefore = web3.eth.getBalance(accounts[0]).toNumber();
			
			await factory.withdraw().should.be.fulfilled;

			const balanceAfter = web3.eth.getBalance(accounts[0]).toNumber();
			
			assert.isTrue(balanceAfter > balanceBefore);
		});
	});

	describe("withdrawForWinner", () => {

		it("should withdraw winner sum for winner", async () => {
			// user1 buys 10 tokens
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[0]}).should.be.fulfilled;
			// user2 buys 20 tokens and becomes a winner
			await factory.buyTokens({value: web3.toWei("0.2", "ether"), from: accounts[1]}).should.be.fulfilled;
			
			const lottery = await factory.getLotteryAtIndex(0);
			const paramGameDuration = lottery[LOTTERY_INDEX_PARAM_GAME_DURATION].toNumber();
			// game ends
			increaseTime(paramGameDuration);
			
			const balanceBefore = web3.eth.getBalance(accounts[1]).toNumber();
			
			await factory.withdrawForWinner(0, {from: accounts[1]}).should.be.fulfilled;

			const balanceAfter = web3.eth.getBalance(accounts[1]).toNumber();
			assert.isTrue(balanceAfter > balanceBefore);
		});
	});

});