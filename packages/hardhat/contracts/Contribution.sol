// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ExternalContract.sol";

contract CooperativeContribution {
	ExternalContract public externalContract;
	address public owner;
	uint public monthlyContribution;
	uint public nextContributionDue;
	address payable businessAddress;
	mapping(address => uint) public memberBalances;
	bool public openForWithdraw;

	event ContributionMade(address indexed contributor, uint amount);
	event BusinessFunded(uint amount);

	constructor(
		uint _monthlyContribution,
		address payable _businessAddress,
		address externalContractAddress
	) {
		externalContract = ExternalContract(externalContractAddress);
		owner = msg.sender;
		monthlyContribution = _monthlyContribution;
		businessAddress = _businessAddress;
		nextContributionDue = block.timestamp + 30 days; // First contribution due in 30 days
	}

	// Modifier to check that ExternalContract is not completed
	modifier notCompleted() {
		require(
			!externalContract.completed(),
			"Contribution process already completed"
		);
		_;
	}

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

		memberBalances[msg.sender] += msg.value;

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
		uint balance = memberBalances[msg.sender];
		require(balance > 0, "You have no balance to withdraw.");
		memberBalances[msg.sender] = 0;
		payable(msg.sender).transfer(balance);
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
