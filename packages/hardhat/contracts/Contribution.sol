// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CooperativeContribution {
	// ExternalContract public externalContract;
	address public owner;
	uint public monthlyContribution;
	uint public nextContributionDue;
	address payable businessAddress;
	mapping(address => uint) public balances;
	bool public openForWithdraw;
	uint256 public deadline = block.timestamp + 48 hours;
	uint256 public constant threshold = 1 ether;

	//events
	event ContributionMade(address indexed contributor, uint amount);
	event BusinessFunded(uint amount);
	event WithdrawEnabled(bool enabled);

	constructor(uint _monthlyContribution, address payable _businessAddress) {
		owner = msg.sender;
		monthlyContribution = _monthlyContribution;
		businessAddress = _businessAddress;
		nextContributionDue = block.timestamp + 30 days; // First contribution due in 30 days
	}

	// Modifier to check that ExternalContract is not completed

	modifier onlyOwner() {
		require(msg.sender == owner, "Only the owner can call this function");
		_;
	}

	function contribute() public payable {
		require(
			msg.value == monthlyContribution,
			"Contribution amount must match the monthly contribution."
		);

		// Ensure contributions are made on time
		require(
			block.timestamp <= nextContributionDue,
			"Monthly contribution period has passed."
		);

		balances[msg.sender] += msg.value;

		emit ContributionMade(msg.sender, msg.value);

		// If all members have contributed, transfer the funds to the business
		if (address(this).balance >= monthlyContribution) {
			businessAddress.transfer(monthlyContribution);
			emit BusinessFunded(monthlyContribution);
			nextContributionDue = block.timestamp + 30 days;
		}
	}

	function withdraw() public {
		require(openForWithdraw, "Withdraw is not yet enabled");
		uint balance = balances[msg.sender];
		require(balance > 0, "You have no balance to withdraw.");
		balances[msg.sender] = 0;
		payable(msg.sender).transfer(balance);
	}

	// Add a `timeLeft()` view function that returns the time left before the deadline for the frontend
	function timeLeft() public view returns (uint256) {
		if (block.timestamp >= deadline) {
			return 0;
		}
		return deadline - block.timestamp;
	}

	// Owner can withdraw any excess funds
	function withdrawExcess() public onlyOwner {
		uint balance = address(this).balance;
		require(
			balance > 0 && balance > monthlyContribution,
			"No excess funds available to withdraw."
		);
		businessAddress.transfer(balance - monthlyContribution);
	}
}
