// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ExternalContract {
	bool public completed;

	function complete() public payable {
		completed = true;
	}
}
