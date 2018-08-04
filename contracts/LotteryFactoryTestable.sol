pragma solidity ^0.4.23;

import "./LotteryFactory.sol";

contract LotteryFactoryTestable is LotteryFactory {

	constructor() public LotteryFactory() {}

	function addToParticipants(address _user) public {
		super._addToParticipants(_user);
	}

	function buyTokensFromSeller(uint _tokenCountToBuy) public {
		super._buyTokensFromSeller(_tokenCountToBuy);
	}

	function buyTokensFromSystem(uint _tokenCountToBuy) public {
		super._buyTokensFromSystem(_tokenCountToBuy);
	}

	function createNewLottery() public {
		super._createNewLottery();
	}

	function getCurrentTokenPrice() public view returns(uint) {
		return super._getCurrentTokenPrice();
	}

	function getNewLotteryCreatedAt() public view returns(uint) {
		return super._getNewLotteryCreatedAt();
	} 

	function getValuePartByPercent(uint _initialValue, uint _percent) public pure returns(uint) {
		return super._getValuePartByPercent(_initialValue, _percent);
	}

	function getWinner() public view returns(address) {
		return super._getWinner();
	}

	function isNeededNewLottery() public view returns(bool) {
		return super._isNeededNewLottery();
	}

}