// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

//0xdb8cd7478ebb88f6551cc3534f2db1c3caa3035a


contract tipjar is Ownable{

     event Tipped(address indexed from, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed to, uint256 amount);

    constructor() Ownable(msg.sender){

    }
    function tip( ) public payable{
        require(msg.value>0,"ERROR");
         emit Tipped(msg.sender, msg.value, block.timestamp);
    }


    function getbalance() public view returns (uint256){
        return address(this).balance;
    }

function withdraw(uint256 amount) public onlyOwner {
    (bool success, ) = owner().call{value: amount}("");
    require(success, "Withdrawal failed");
    emit Withdrawn(owner(), amount);
}

}