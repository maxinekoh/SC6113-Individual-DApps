# FairHold - Actual Test Results (13 October 2026)

*Based on screenshots provided during the development session and the student's descriptions. Where an outcome was not directly demonstrated, it is explicitly marked Not tested.*

| ID | Test | Outcome | Evidence / observation |
|---|---|---|---|
| T01 | Connect wallet on Sepolia | Pass | FairHold displayed connected wallet and Sepolia confirmation. |
| T02 | Create escrow with 0.001 ETH | Pass (UI confirmed) | `01-escrow-funded.png`; status Funded. |
| T03 | Release funded escrow as buyer | Pass (UI confirmed) | `02-escrow-released.png`; status Released; event appeared. |
| T04 | Release from seller wallet | **Not tested** | Seller-account connection troubleshooting was skipped. |
| T05 | Refund before deadline, directly on-chain | **Not tested** | UI withheld refund action before deadline, but direct Solidity rejection not verified. |
| T06 | Refund after deadline | Pass (UI confirmed) | `03-escrow-refunded.png`; status Refunded; event appeared. |
| T07 | Attempt duplicate release | **Not tested** | No direct transaction/revert evidence captured. |
| T08 | Zero-amount deposit | Pass (manual frontend) | Student reported rejection; no screenshot retained. |
| T09 | Invalid seller address | Pass (manual frontend) | Student reported rejection; no screenshot retained. |
| T10 | Correct wallet network selection | Pass (functional outcome) | Initially Mainnet mismatch; corrected to Sepolia before deployment. |
| T11 | Reject signing in MetaMask | **Not tested** | Not performed. |
| T12 | Event history displays explorer links | Pass (UI observed) | Created / Released / Refunded history shown in screenshots. |
| T13 | Flask RPC verification endpoint | **Not tested** | `SEPOLIA_RPC_URL` not confirmed configured; no JSON evidence. |

## Extra manual validation

- Expired input deadline: Pass (manual frontend, student reported rejection).
- Seller wallet direct contract authentication: Not tested.

## Automated Flask unit tests

**Command:** `python -m unittest discover -s tests -v`  
**Observed result:** `Ran 7 tests in 0.145s`, `OK`  
**Evidence:** `04-backend-tests.png`

| Test name | Result |
|---|---|
| `test_expired_deadline_rejected` | Pass |
| `test_fractional_wei_rejected` | Pass |
| `test_invalid_tx_hash_rejected` | Pass |
| `test_malformed_seller_rejected` | Pass |
| `test_positive_quote_and_conversion` | Pass |
| `test_same_wallet_rejected` | Pass |
| `test_zero_amount_rejected` | Pass |

## Transaction references

- Contract address supplied during deployment: `0xb422a2a6e0c6416141217339ca636c9e7739f96d`.
- Deployment block supplied: `11905977` (verify against Etherscan receipt).
- Escrow #1 creation hash recorded in the UI: `0x38748b2660873692d9a61882004e4732ab1ed4986874cfb36c7a3796775fc337`.
- Escrow #1 release hash recorded in the UI: `0xa2cc3cd637f50b387919e047e6b7692154de6d7895c1a2de75581385bec6f29e`.
- Escrow #2 creation/refund hashes are displayed in abbreviated form in the screenshots. Copy full values from Sepolia Etherscan or your app before citing them as full hashes.