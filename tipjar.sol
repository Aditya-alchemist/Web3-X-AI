// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract tipjar is Ownable{

    constructor() Ownable(msg.sender){

    }
    function tip(uint256 amount ) public payable{
        require(msg.value == amount, "You must send the exact amount");
    }


    function getbalance() public view returns (uint256){
        return address(this).balance;
    }

function withdraw(uint256 amount) public onlyOwner {
    (bool success, ) = owner().call{value: amount}("");
    require(success, "Withdrawal failed");
}

}