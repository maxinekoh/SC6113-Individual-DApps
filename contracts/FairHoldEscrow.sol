// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FairHoldEscrow
/// @notice A small educational ETH escrow for two parties on a test network.
/// @dev No arbitrator exists. Buyers decide when to release, or may refund after a deadline.
contract FairHoldEscrow {
    enum Status { Unset, Funded, Released, Refunded }

    struct Escrow {
        address payable buyer;
        address payable seller;
        uint256 amount;
        uint64 refundAfter;
        Status status;
    }

    uint256 public nextEscrowId = 1;
    mapping(uint256 => Escrow) private escrows;
    mapping(address => uint256[]) private userEscrows;

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint64 refundAfter
    );
    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    /// @notice Place ETH in escrow. The wallet signing this transaction is the buyer.
    function createEscrow(address payable seller, uint64 refundAfter)
        external
        payable
        returns (uint256 escrowId)
    {
        require(seller != address(0), "Seller address is zero");
        require(seller != msg.sender, "Seller cannot be buyer");
        require(msg.value > 0, "Deposit must be positive");
        require(refundAfter > block.timestamp + 60, "Deadline is too soon");
        require(refundAfter <= block.timestamp + 365 days, "Deadline is too far");

        escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            buyer: payable(msg.sender),
            seller: seller,
            amount: msg.value,
            refundAfter: refundAfter,
            status: Status.Funded
        });
        userEscrows[msg.sender].push(escrowId);
        userEscrows[seller].push(escrowId);
        emit EscrowCreated(escrowId, msg.sender, seller, msg.value, refundAfter);
    }

    /// @notice Only the buyer can release the escrowed funds to the seller.
    function releasePayment(uint256 escrowId) external {
        Escrow storage item = escrows[escrowId];
        require(item.status == Status.Funded, "Escrow is not funded");
        require(msg.sender == item.buyer, "Only buyer can release");

        // Checks-effects-interactions: update state before sending ETH.
        item.status = Status.Released;
        (bool success, ) = item.seller.call{value: item.amount}("");
        require(success, "Payment failed");
        emit EscrowReleased(escrowId, item.buyer, item.seller, item.amount);
    }

    /// @notice Only the buyer can refund an unreleased escrow after its deadline.
    function refundPayment(uint256 escrowId) external {
        Escrow storage item = escrows[escrowId];
        require(item.status == Status.Funded, "Escrow is not funded");
        require(msg.sender == item.buyer, "Only buyer can refund");
        require(block.timestamp >= item.refundAfter, "Refund deadline not reached");

        item.status = Status.Refunded;
        (bool success, ) = item.buyer.call{value: item.amount}("");
        require(success, "Refund failed");
        emit EscrowRefunded(escrowId, item.buyer, item.seller, item.amount);
    }

    function getEscrow(uint256 escrowId)
        external
        view
        returns (
            address buyer,
            address seller,
            uint256 amount,
            uint64 refundAfter,
            Status status
        )
    {
        Escrow storage item = escrows[escrowId];
        require(item.status != Status.Unset, "Escrow does not exist");
        return (item.buyer, item.seller, item.amount, item.refundAfter, item.status);
    }

    function getUserEscrows(address participant) external view returns (uint256[] memory) {
        return userEscrows[participant];
    }

    // Prevent accidentally sent ETH from being mistaken for a funded escrow.
    receive() external payable { revert("Use createEscrow"); }
    fallback() external payable { revert("Unsupported call"); }
}
