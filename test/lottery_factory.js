const { increaseTime } = require("./utils/helpers");

const LotteryFactoryTestable = artifacts.require("LotteryFactoryTestable");

const LOTTERY_INDEX_CREATED_AT = 0;
const LOTTERY_INDEX_TOKEN_COUNT = 1;
const LOTTERY_INDEX_TOKEN_COUNT_TO_SELL = 2;
const LOTTERY_INDEX_WINNER_SUM = 3;
const LOTTERY_INDEX_WINNER = 4;
const LOTTERY_INDEX_PRIZE_REDEEMED = 5;
const LOTTERY_INDEX_PARTICIPANTS = 6;
const LOTTERY_INDEX_PARAM_GAME_DURATION = 7;
const LOTTERY_INDEX_PARAM_INITIAL_TOKEN_PRICE = 8;
const LOTTERY_INDEX_PARAM_DURATION_TO_TOKEN_PRICE_UP = 9;
const LOTTERY_INDEX_PARAM_TOKEN_PRICE_INCREASE_PERCENT = 10;
const LOTTERY_INDEX_PARAM_TRADE_COMMISSION = 11;
const LOTTERY_INDEX_PARAM_WINNER_COMMISSION = 12;

const SALE_INDEX_ADDRESS = 0;
const SALE_INDEX_AMOUNT = 1;

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

		it("should add seller address on first sale", async () => {
			let sales = await factory.getSales();
			const addressesBefore = sales[SALE_INDEX_ADDRESS];
			assert.equal(addressesBefore.length, 0);

			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;

			sales = await factory.getSales();
			const addressesAfter = sales[SALE_INDEX_ADDRESS];
			assert.equal(addressesAfter.length, 1);
		});

		it("should add amount on first sale", async () => {
			let sales = await factory.getSales();
			const amountsBefore = sales[SALE_INDEX_AMOUNT];
			assert.equal(amountsBefore.length, 0);

			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;

			sales = await factory.getSales();
			const amountsAfter = sales[SALE_INDEX_AMOUNT];
			assert.equal(amountsAfter[0].toNumber(), 1);
		});

		it("should set seller id on first sale", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;

			const sellerId = await factory.sellerIdOf(accounts[0]);
			assert.equal(sellerId.toNumber(), 0);
		});

		it("should add seller address on first user's sale", async () => {
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;

			let sales = await factory.getSales();
			const addressesBefore = sales[SALE_INDEX_ADDRESS];
			assert.equal(addressesBefore.length, 1);

			/// user2 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[1]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[1]}).should.be.fulfilled;

			sales = await factory.getSales();
			const addressesAfter = sales[SALE_INDEX_ADDRESS];
			assert.equal(addressesAfter.length, 2);
			assert.equal(addressesAfter[1], accounts[1]);
		});

		it("should add amount on first user's sale", async () => {
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;

			let sales = await factory.getSales();
			const amountsBefore = sales[SALE_INDEX_AMOUNT];
			assert.equal(amountsBefore.length, 1);

			// user2 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[1]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[1]}).should.be.fulfilled;

			sales = await factory.getSales();
			const amountsAfter = sales[SALE_INDEX_AMOUNT];
			assert.equal(amountsAfter.length, 2);
		});

		it("should set seller id on first user's sale", async () => {
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;
			// user2 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[1]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[1]}).should.be.fulfilled;

			const sellerId = await factory.sellerIdOf(accounts[1]);
			assert.equal(sellerId.toNumber(), 1);
		});

		it("should approve tokens on scenario: u1 buys 1, u1 approves 1, u1 buys 1, u1 approves 1", async () => {
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;

			let sales = await factory.getSales();
			const addresses = sales[SALE_INDEX_ADDRESS];
			const amounts = sales[SALE_INDEX_AMOUNT];
			assert.equal(addresses.length, 1);
			assert.equal(addresses[0], accounts[0]);
			assert.equal(amounts.length, 1);
			assert.equal(amounts[0].toNumber(), 2);
		});

		it("should add tokens amount to an existing sale", async () => {
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;
			// user2 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[1]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[1]}).should.be.fulfilled;
			// user2 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[1]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[1]}).should.be.fulfilled;

			let sales = await factory.getSales();
			const addresses = sales[SALE_INDEX_ADDRESS];
			const amounts = sales[SALE_INDEX_AMOUNT];
			assert.equal(addresses.length, 2);
			assert.equal(addresses[1], accounts[1]);
			assert.equal(amounts.length, 2);
			assert.equal(amounts[1].toNumber(), 2);
		});

		it("should update owner token count to sell", async () => {
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;

			const balanceSelling = await factory.balanceSellingOf(accounts[0]);
			assert.equal(balanceSelling.toNumber(), 1);
		});

		it("should update lottery token count to sell", async () => {
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;

			const lottery = await factory.getLotteryAtIndex(0);
			assert.equal(lottery[LOTTERY_INDEX_TOKEN_COUNT_TO_SELL].toNumber(), 1);
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

		it("should not create a new lottery if game is still in progress", async () => {
			const lotteryCountBefore = await factory.lotteryCount();
			assert.equal(lotteryCountBefore.toNumber(), 1);
			
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;

			const lotteryCountAfter = await factory.lotteryCount();
			assert.equal(lotteryCountAfter.toNumber(), 1);
		});

		it("should create a new lottery if game finished", async () => {
			const lotteryCountBefore = await factory.lotteryCount();
			assert.equal(lotteryCountBefore.toNumber(), 1);
			
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;

			const lottery = await factory.getLotteryAtIndex(0);
			const paramGameDuration = lottery[LOTTERY_INDEX_PARAM_GAME_DURATION].toNumber();
			// game ends
			increaseTime(paramGameDuration + 1);

			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;

			const lotteryCountAfter = await factory.lotteryCount();
			assert.equal(lotteryCountAfter.toNumber(), 2);
		});

		it("should add extra eth to winner sum", async () => {
			const value = web3.toWei("0.011", "ether");
			await factory.buyTokens({value: value, from: accounts[0]}).should.be.fulfilled;

			const lottery = await factory.getLotteryAtIndex(0);
			assert.equal(lottery[LOTTERY_INDEX_WINNER_SUM].toNumber(), value);
		});

		it("should throw if user wants to buy 0 tokens", async () => {
			const lottery = await factory.getLotteryAtIndex(0);
			const paramDurationToTokenPriceUp = lottery[LOTTERY_INDEX_PARAM_DURATION_TO_TOKEN_PRICE_UP].toNumber();
			
			// stage 2
			increaseTime(paramDurationToTokenPriceUp);

			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.rejectedWith("revert");
		});

		it("should buy tokens from sellers if there are any", async () => {
			// user1 buys 1 token and approves it to sell
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;

			let lottery = await factory.getLotteryAtIndex(0);
			const tokenCountBefore = lottery[LOTTERY_INDEX_TOKEN_COUNT].toNumber();
			assert.equal(tokenCountBefore, 1);
			
			// user2 buys 1 token from user1
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[1]}).should.be.fulfilled;

			lottery = await factory.getLotteryAtIndex(0);
			const tokenCountAfter = lottery[LOTTERY_INDEX_TOKEN_COUNT].toNumber();
			assert.equal(tokenCountAfter, 1);
		});

		it("should buy tokens from system if there are not any on sale", async () => {
			let lottery = await factory.getLotteryAtIndex(0);
			const tokenCountBefore = lottery[LOTTERY_INDEX_TOKEN_COUNT].toNumber();
			assert.equal(tokenCountBefore, 0);

			// user1 buys 1 token
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;

			lottery = await factory.getLotteryAtIndex(0);
			const tokenCountAfter = lottery[LOTTERY_INDEX_TOKEN_COUNT].toNumber();
			assert.equal(tokenCountAfter, 1);
		});

		it("should add buyer to participants", async () => {
			let lottery = await factory.getLotteryAtIndex(0);
			const participantsBefore = lottery[LOTTERY_INDEX_PARTICIPANTS];
			assert.equal(participantsBefore.length, 0);

			// user1 buys 1 token
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;

			lottery = await factory.getLotteryAtIndex(0);
			const participantsAfter = lottery[LOTTERY_INDEX_PARTICIPANTS];
			assert.equal(participantsAfter.length, 1);
			assert.equal(participantsAfter[0], accounts[0]);
		});

		it("should update winner sum on tokens purchase", async () => {
			// user1 buys 1 token
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;

			let lottery = await factory.getLotteryAtIndex(0);
			let winnerSum = lottery[LOTTERY_INDEX_WINNER_SUM].toNumber();
			assert.equal(winnerSum, web3.toWei("0.01", "ether"));

			// user2 buys 2 tokens
			await factory.buyTokens({value: web3.toWei("0.02", "ether"), from: accounts[1]}).should.be.fulfilled;

			lottery = await factory.getLotteryAtIndex(0);
			winnerSum = lottery[LOTTERY_INDEX_WINNER_SUM].toNumber();
			assert.equal(winnerSum, web3.toWei("0.03", "ether"));
		});

		it("should update winner sum on scenario: u1 buys 10, u2 buys 10, u1 approves to sell 5, u2 buys 10", async () => {
			// user1 buys 10 tokens
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[0]}).should.be.fulfilled;
			// user2 buys 10 tokens
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[1]}).should.be.fulfilled;
			// user1 approves to sell 5
			await factory.approveToSell(5, {from: accounts[0]}).should.be.fulfilled;
			// user2 buys 10 tokens
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[1]}).should.be.fulfilled;

			let lottery = await factory.getLotteryAtIndex(0);
			const paramInitialTokenPrice = lottery[LOTTERY_INDEX_PARAM_INITIAL_TOKEN_PRICE].toNumber();
			const winnerSum = lottery[LOTTERY_INDEX_WINNER_SUM].toNumber();
			const expectedWinnerSum = web3.toWei("0.3", "ether") - 5 * paramInitialTokenPrice;
			assert.equal(winnerSum, expectedWinnerSum);
		});

		it("should update winner on tokens purchase", async () => {
			// user1 buys 1 token
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;

			let lottery = await factory.getLotteryAtIndex(0);
			let winner = lottery[LOTTERY_INDEX_WINNER];
			assert.equal(winner, accounts[0]);

			// user2 buys 2 tokens
			await factory.buyTokens({value: web3.toWei("0.02", "ether"), from: accounts[1]}).should.be.fulfilled;

			lottery = await factory.getLotteryAtIndex(0);
			winner = lottery[LOTTERY_INDEX_WINNER];
			assert.equal(winner, accounts[1]);
		});

		it("should buy tokens on this scenario: u1 buys 1, u2 buys 2, u1 approves to sell 1, u2 approves to sell 1, u3 buys 3", async () => {
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

		it('should buy tokens on this scenario: u1 buys 10, u1 approves to sell 5, u1 buys 10', async () => {
			// user1 buys 10 tokens
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[0]}).should.be.fulfilled;
			// user1 approves to sell 5 tokens
			await factory.approveToSell(5, {from: accounts[0]}).should.be.fulfilled;
			// user1 buys 10 tokens
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[0]}).should.be.fulfilled;

			const lottery = await factory.getLotteryAtIndex(0);
			assert.equal(lottery[LOTTERY_INDEX_TOKEN_COUNT].toNumber(), 20);
		});
	});

	describe("disapproveToSell", () => {

		it("should throw if user has not enough tokens to disapprove selling", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;
			await factory.approveToSell(2).should.be.rejectedWith("revert");
		});

		it("should decrease user's selling amount", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;

			let sales = await factory.getSales();
			const sellingAmountsBefore = sales[SALE_INDEX_AMOUNT];
			assert.equal(sellingAmountsBefore[0].toNumber(), 1);

			await factory.disapproveToSell(1).should.be.fulfilled;

			sales = await factory.getSales();
			const sellingAmountsAfter = sales[SALE_INDEX_AMOUNT];
			assert.equal(sellingAmountsAfter[0].toNumber(), 0);
		});

		it("should decrease user's token count to sell", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;

			const balanceBeforeDisapprove = await factory.balanceSellingOf(accounts[0])
			assert.equal(balanceBeforeDisapprove.toNumber(), 1);

			await factory.disapproveToSell(1).should.be.fulfilled;

			const balanceAfterDisapprove = await factory.balanceSellingOf(accounts[0])
			assert.equal(balanceAfterDisapprove.toNumber(), 0);
		});

		it("should decrease lottery token count to sell", async () => {
			await factory.buyTokens({value: web3.toWei("0.01", "ether")}).should.be.fulfilled;
			await factory.approveToSell(1).should.be.fulfilled;

			let lottery = await factory.getLotteryAtIndex(0);
			assert.equal(lottery[LOTTERY_INDEX_TOKEN_COUNT_TO_SELL].toNumber(), 1);

			await factory.disapproveToSell(1).should.be.fulfilled;

			lottery = await factory.getLotteryAtIndex(0);
			assert.equal(lottery[LOTTERY_INDEX_TOKEN_COUNT_TO_SELL].toNumber(), 0);
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

	describe("getTokenCountToBuyFromSeller", () => {

		it("should throw if token count to buy <= 0", async () => {
			await factory.getTokenCountToBuyFromSeller(0).should.be.rejectedWith("revert");
		});

		it("should return 0 if there are no tokens on sale", async () => {
			const count = await factory.getTokenCountToBuyFromSeller(1);
			assert.equal(count.toNumber(), 0);
		});

		it("should return 0 if there are only buyer's tokens on sale", async () => {
			// user1 buys 10 tokens and approves them to sell
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(10, {from: accounts[0]}).should.be.fulfilled;

			const count = await factory.getTokenCountToBuyFromSeller(1);
			assert.equal(count.toNumber(), 0);
		});

		it("should return token count on sale if there are less tokens than user needs", async () => {
			// user1 buys 10 tokens and approves 5 to sell
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(5, {from: accounts[0]}).should.be.fulfilled;
			// user2 checks how many tokens he can buy from sellers
			const count = await factory.getTokenCountToBuyFromSeller(10, {from: accounts[1]});
			assert.equal(count.toNumber(), 5);
		});

		it("should return token count on sale if there are more tokens than user needs", async () => {
			// user1 buys 10 tokens and approves 10 to sell
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(10, {from: accounts[0]}).should.be.fulfilled;
			// user2 checks how many tokens he can buy from sellers
			const count = await factory.getTokenCountToBuyFromSeller(10, {from: accounts[1]});
			assert.equal(count.toNumber(), 10);
		});
	});

	describe("getTop", () => {

		it("should throw on attempt to find top 0 users", async () => {
			await factory.getTop(0).should.be.rejectedWith("revert");
		});

		it("should return empty addresses and balances if there are no purchases", async () => {
			const top = await factory.getTop(2);
			const addresses = top[0];
			const balances = top[1];

			assert.equal(addresses.length, 2);
			assert.equal(addresses[0], "0x0000000000000000000000000000000000000000");
			assert.equal(addresses[1], "0x0000000000000000000000000000000000000000");
			assert.equal(balances.length, 2);
			assert.equal(balances[0].toNumber(), 0);
			assert.equal(balances[1].toNumber(), 0);
		});

		it("should find top 2 users out of 3", async () => {
			// user1 buys 10 tokens
			await factory.buyTokens({value: web3.toWei("0.1", "ether"), from: accounts[0]}).should.be.fulfilled;
			// user2 buys 20 tokens
			await factory.buyTokens({value: web3.toWei("0.2", "ether"), from: accounts[1]}).should.be.fulfilled;
			// user3 buys 30 tokens
			await factory.buyTokens({value: web3.toWei("0.3", "ether"), from: accounts[2]}).should.be.fulfilled;

			const top = await factory.getTop(2);
			const addresses = top[0];
			const balances = top[1];

			assert.equal(addresses.length, 2);
			assert.equal(addresses[0], accounts[2]);
			assert.equal(addresses[1], accounts[1]);
			assert.equal(balances.length, 2);
			assert.equal(balances[0].toNumber(), 30);
			assert.equal(balances[1].toNumber(), 20);
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

		it("should throw if commission sum <= 0", async () => {
			await factory.withdraw().should.be.rejectedWith("revert");
		});

		it("should reset commission sum after withdraw", async () => {
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;
			// user2 buys 1 token and increases contract's commision sum
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[1]}).should.be.fulfilled;

			const commissionSumBefore = await factory.commissionSum();
			assert.isTrue(commissionSumBefore.toNumber() != 0);

			await factory.withdraw().should.be.fulfilled;

			const commissionSumAfter = await factory.commissionSum();
			assert.equal(commissionSumAfter.toNumber(), 0);
		});

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

		it("should not allow to withdraw commission 2 times", async () => {
			// user1 buys 1 token and approves it for sale
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[0]}).should.be.fulfilled;
			await factory.approveToSell(1, {from: accounts[0]}).should.be.fulfilled;
			// user2 buys 1 token and increases contract's commision sum
			await factory.buyTokens({value: web3.toWei("0.01", "ether"), from: accounts[1]}).should.be.fulfilled;

			await factory.withdraw().should.be.fulfilled;
			await factory.withdraw().should.be.rejectedWith("revert");
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
			increaseTime(paramGameDuration + 1);
			
			const balanceBefore = web3.eth.getBalance(accounts[1]).toNumber();
			
			await factory.withdrawForWinner(0, {from: accounts[1]}).should.be.fulfilled;

			const balanceAfter = web3.eth.getBalance(accounts[1]).toNumber();
			assert.isTrue(balanceAfter > balanceBefore);
		});
	});

});