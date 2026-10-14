# FairHold - SC6113 Individual Financial DApp

**Course:** SC6113 DApps Development  
**Network:** Ethereum Sepolia testnet (chain ID `11155111`)  
**Purpose:** Educational demonstration using **test ETH only**. Not audited or intended for real funds.

## Live Application

FairHold is deployed on Render:

https://sc6113-fairhold-maxine.onrender.com/

Network: Ethereum Sepolia (testnet)

The application requires MetaMask to interact
with the deployed smart contract.

## Overview

FairHold is a small, buyer-controlled escrow payment DApp for freelance or peer-to-peer services. A buyer deposits Sepolia test ETH for a designated seller. The ETH remains in a Solidity contract until the buyer releases it to the seller or, after the selected deadline, requests a refund. Escrow states and transactions are recorded on-chain.

**Trust-model limitation:** The contract cannot establish whether the seller completed the work. The buyer has unilateral control over release and can refund after the deadline while the escrow remains funded. No independent dispute resolver exists.

## Technologies

- **Blockchain:** Ethereum Sepolia; Solidity `^0.8.24` (`contracts/FairHoldEscrow.sol`)
- **Wallet and interactions:** MetaMask, ethers.js v6 (`static/app.js`)
- **Backend:** Python Flask (`app.py`)
- **Frontend:** HTML, CSS, JavaScript (`templates/`, `static/`)
- **Development:** Remix IDE; GitHub Codespaces
- **History:** Solidity events queried by the browser; no database is used

## Project structure

```text
contracts/FairHoldEscrow.sol   Escrow smart contract
static/app.js                 MetaMask, contract calls and event history
static/styles.css             Frontend styling
templates/index.html          User interface
app.py                        Flask server and validation API
config.json                   Public contract deployment metadata
requirements.txt              Python dependencies
tests/test_backend.py         Automated Flask tests
tests/TEST_PLAN.md            Manual testing checklist
screenshots/                  Observed implementation/test screenshots
README.md                     Setup, architecture and testing
```

## Contract deployment

The Sepolia contract address recorded during project testing is:

`0xb422a2a6e0c6416141217339ca636c9e7739f96d`

The reported deployment block is `11905977`. **Check this block number and the address against your successful deployment receipt before submission.** These details were recorded during manual setup, not independently fetched for this document.

The frontend should use:

```json
{
  "contract_address": "0xb422a2a6e0c6416141217339ca636c9e7739f96d",
  "deployment_block": 11905977,
  "chain_id": 11155111
}
```

## Run locally or in GitHub Codespaces

1. Clone/open the repository in Codespaces or VS Code.
2. In its terminal, run:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

3. In Codespaces, open port **5000** from the **Ports** panel. Locally, visit `http://127.0.0.1:5000`.
4. Select Sepolia in MetaMask, connect your buyer account, and ensure it holds **Sepolia test ETH** to pay gas.
5. Create an escrow for a **different** seller address with a positive amount and a valid future refund deadline.
6. Once the transaction is mined, verify the new escrow has status **Funded**.
7. Use **Release to seller** to complete the payment, or create a separate funded escrow and select **Refund buyer** after its deadline.

The app's actions must be signed in MetaMask. Do not attempt these steps with real ETH.

## Smart contract functions

| Function | Purpose |
|---|---|
| `createEscrow(address payable seller, uint64 refundAfter)` | Accepts ETH, validates parameters, creates a funded escrow |
| `releasePayment(uint256 escrowId)` | Buyer transfers funded escrow's ETH to seller |
| `refundPayment(uint256 escrowId)` | Buyer reclaims funded escrow after deadline |
| `getEscrow(uint256 escrowId)` | Returns an escrow's data/state |
| `getUserEscrows(address participant)` | Lists escrow IDs for buyer or seller |

The state machine is **Funded -> Released** or **Funded -> Refunded**, with no further settlement after a terminal state. The contract emits `EscrowCreated`, `EscrowReleased` and `EscrowRefunded` events.

## Validation and backend

- `GET /`: web UI
- `GET /api/config`: public contract address, deployment block and Sepolia chain ID
- `POST /api/validate`: checks seller/buyer addresses, distinct wallets, positive/finite ETH amount, whole-wei precision and refund deadline
- `GET /api/verify/<tx_hash>`: **optional**, read-only receipt verification through a separately configured Sepolia RPC endpoint

The optional endpoint requires `SEPOLIA_RPC_URL` to be set in the server environment. It was **not demonstrated as fully configured or passing** in the test record. Flask never signs transactions; MetaMask handles transaction authorization, and Solidity enforces settlement rules.

## Testing status

### Observed on Sepolia

- MetaMask connected to Sepolia.
- Escrow #1: 0.001 test ETH funded and then released; UI displayed status **Released** and corresponding events.
- Escrow #2: 0.001 test ETH funded and then refunded after deadline; UI displayed status **Refunded** and corresponding events.
- Transaction history showed creation, release and refund with Etherscan links.
- Manual invalid seller address, zero deposit and expired-deadline input were reported rejected by the web interface.

The application UI reported successful transactions. For independently verifiable receipts, use the explorer links generated by the app and check the destination contract, status and transferred value.

### Automated Python tests

Run:

```bash
python -m unittest discover -s tests -v
```

A Codespaces run on 13 October 2026 showed **7 tests passed** (about **0.145 s**), covering valid wei conversion, same-wallet rejection, zero amount, fractional wei, malformed seller address, expired deadline and invalid transaction hash. These test Flask validation, not direct Solidity access controls.

### Not yet tested / demonstrated

- Direct seller-wallet attempt to release or refund someone else's escrow
- Duplicate release or refund from a settled escrow
- Contract-level early refund revert through Remix
- Optional Flask RPC receipt verification
- Gas/latency benchmarking and smart contract audit

Do not mark these as passed without performing the tests.

## Evidence

The `screenshots/` directory should contain:

- `01-escrow-funded.png`
- `02-escrow-released.png`
- `03-escrow-refunded.png`
- `04-backend-tests.png`

## Final Report

[SC6113 FairHold Individual Report](SC6113_FairHold_Individual.pdf)

## Security, privacy and limitations

The contract validates the escrow state and buyer permissions, uses checks-effects-interactions during transfers and does not hold users' private keys. However, this demonstration has no independent arbitration, seller delivery validation, formal audit, monitoring or production-grade hosting. Blockchain events and wallet addresses are publicly viewable. Testnet gas fees still apply.

## References

- [Solidity documentation](https://docs.soliditylang.org/)
- [ethers.js documentation](https://docs.ethers.org/v6/)
- [Flask documentation](https://flask.palletsprojects.com/)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
