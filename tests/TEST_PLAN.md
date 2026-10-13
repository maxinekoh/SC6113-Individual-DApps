# SC6113 FairHold manual testing and evidence log

Fill in the ACTUAL result (Pass/Fail) and screenshot filename. Never mark a test "Pass" merely because code exists; run it.

| ID | Test | Expected outcome | Actual outcome | Evidence screenshot |
|---|---|---|---|---|
| T01 | MetaMask on Sepolia connects | Wallet address shown | Not tested | |
| T02 | Buyer creates escrow using 0.001 test ETH | Tx mined, escrow funded and visible | Not tested | |
| T03 | Buyer releases funded escrow | Seller receives amount, status Released | Not tested | |
| T04 | Seller attempts release | Transaction reverts; unauthorized | Not tested | |
| T05 | Buyer attempts refund before deadline | Reverted or no refund action offered; contract rejects | Not tested | |
| T06 | Buyer refunds after deadline | Funded -> Refunded; buyer receives ETH | Not tested | |
| T07 | Buyer attempts duplicate release | Reverts because escrow not Funded | Not tested | |
| T08 | Create escrow with 0 amount | Backend and contract reject | Not tested | |
| T09 | Malformed seller address | Frontend/backend reject | Not tested | |
| T10 | Wrong network selected | Wallet prompts to switch to Sepolia | Not tested | |
| T11 | Wallet denies signing | Clear user-readable error; no funds moved | Not tested | |
| T12 | Activity shows contract event tx hashes | Links resolve to Sepolia explorer records | Not tested | |
| T13 | Optional Flask RPC verify returns confirmed, success, belongs_to_contract | Read-only verification successful | Not tested | |

## Evidence capture list

1. Remix showing Solidity compilation success.
2. Remix deployment contract address + Sepolia network (no private information).
3. Flask website before wallet connection.
4. Flask website with test wallet connected.
5. Escrow created and visible as Funded.
6. Successful release and Released state.
7. Successful refund of a second escrow and Refunded state.
8. Invalid input or rejected unauthorized transaction (record revert reason).
9. Transaction history with testnet explorer hyperlinks.
10. Optional Flask backend transaction verification JSON result.

## Understand before writing the report

- The contract holds ETH because `createEscrow()` is `payable` and receives `msg.value`.
- The payer's wallet is the buyer: `msg.sender`. The UI cannot claim a different payer.
- Only the buyer can call `releasePayment()` or `refundPayment()` successfully.
- The refund deadline and status are enforced on-chain, independently of Flask.
- `status` changes before the external ETH call (checks-effects-interactions). If the transfer fails, the whole transaction reverts and restores the status.
- Events, not the Flask server or an optional database, provide tamper-evident transaction history.
- Caveat: Buyer controls release and can refund after the deadline regardless of whether the seller fulfilled the job. This is a limitation of the trust model.
