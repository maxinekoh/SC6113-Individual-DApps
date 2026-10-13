# FairHold — SC6113 Financial DApp starter

**Important:** This is an educational starter to inspect, adapt, deploy and test yourself. **It has NOT been deployed to Sepolia or tested with MetaMask in this package.** Use *only* test ETH. There are no private keys and no real funds. The professor's GitHub repository was read for context only and was not modified.

## 1. What it does

FairHold is a simple student freelance-payment escrow: a buyer deposits Sepolia ETH into a Solidity smart contract for a designated seller. The buyer can release the payment, or request a refund after an expiry deadline while it is still funded. The contract emits events for transaction history.

**Important limitation:** The buyer controls releases and refunds; there is no dispute-resolution mechanism. The seller could perform the work without receiving payment if the buyer waits to refund. This is educational, **not production-ready**, and must not hold real funds.

## 2. Folder structure

- `contracts/FairHoldEscrow.sol`: Solidity smart contract; deploy with Remix
- `app.py`: Flask application; serves UI, validates escrow input, optionally verifies transactions against an RPC
- `templates/index.html`: HTML page
- `static/app.js`: MetaMask + ethers.js interaction, on-chain read/write operations, history
- `static/styles.css`: styling
- `config.json`: PUBLIC deployed contract address and deployment block
- `tests/TEST_PLAN.md`: manually execute test cases and capture screenshots
- `REPORT_OUTLINE.md`: report planning checklist

## 3. Setup for a beginner on macOS

1. Install **MetaMask** browser extension, **Python 3**, and **VS Code**. Make a dedicated test wallet; never enter a wallet seed phrase in websites, code, ChatGPT, screenshots or GitHub.
2. Open the `FairHold_SC6113_Starter` folder in VS Code.
3. In the VS Code Terminal, run:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

4. You can start Flask immediately with:

```bash
python app.py
```

5. Open **http://127.0.0.1:5000** in the same browser where MetaMask is installed. The UI will initially tell you to deploy/configure the contract.

## 4. Deploy the Solidity contract on Sepolia

1. In MetaMask, enable test networks and select **Ethereum Sepolia** (chain ID `11155111`). Request a small amount of *Sepolia test ETH* from a reputable faucet (e.g. MetaMask Developer faucet); test ETH covers deployments and gas. Never buy it as actual ETH.
2. Open **https://remix.ethereum.org**. In a NEW Remix workspace, create `FairHoldEscrow.sol` and paste the code from `contracts/FairHoldEscrow.sol`.
3. Go to **Solidity Compiler**. Select a compatible **0.8.24 or newer 0.8.x** compiler, then compile. Fix any compiler errors before proceeding.
4. In **Deploy & Run Transactions**, select the browser-wallet environment, sometimes shown as **Browser Extension** or **Injected Provider – MetaMask**, depending on Remix version. Ensure it is connected to Sepolia, *not Ethereum Mainnet*.
5. Select `FairHoldEscrow`, deploy and approve the transaction in MetaMask. The deployment costs test ETH. Wait for a mined deployment receipt.
6. Copy the **new contract address** from Remix's deployed contracts panel or the transaction receipt. Also record its **deployment block number** from the receipt/block explorer.
7. Edit **only your local** `config.json`:

```json
{
  "contract_address": "0xYOUR_ACTUAL_DEPLOYED_CONTRACT_ADDRESS",
  "deployment_block": 12345678,
  "chain_id": 11155111
}
```

Replace both example values with actual ones. Do not enter these placeholders literally. Restart Flask if desired (the backend reads this configuration for each request).

## 5. Run the financial DApp

1. Start Flask via `python app.py` in the virtual environment.
2. Visit **http://127.0.0.1:5000** (a local server; do not open `index.html` by double-clicking it).
3. Click **Connect MetaMask** and authorize only your test account on **Sepolia**.
4. Have **two different test wallet accounts** in MetaMask: Buyer (has Sepolia ETH) and Seller.
5. Buyer: enter the seller's test address, a small test amount like `0.001`, and a deadline at least 3 minutes in the future. Submit and approve the *payable* escrow transaction.
6. Wait for confirmation. The escrow should appear as **Funded**, including its contract-held balance. Click **Release to seller**, approve, and confirm it becomes **Released**.
7. For the refund branch, create a **second escrow** with a near-term future deadline. Once the on-chain deadline has passed, click **Refresh**, then **Refund buyer**. The contract should set the status to **Refunded**.
8. Switch MetaMask to the Seller wallet to confirm it can **view** an escrow but **cannot release or refund it**.
9. Observe transaction history with Etherscan links. Capture the screenshots listed in `tests/TEST_PLAN.md`.

If you see a history-range error, check the exact `deployment_block` value and try refreshing. Some free RPCs limit historical log queries.

## 6. Optional: enable read-only transaction verification in Flask

The Flask backend can independently verify that a transaction hash refers to a confirmed successful call to your configured escrow address. It never signs transactions. This feature needs a **Sepolia HTTPS RPC URL** from your own node provider.

```bash
export SEPOLIA_RPC_URL='https://YOUR_SEPOLIA_RPC_ENDPOINT'
python app.py
```

An RPC URL may contain an API key; never commit it in files or publish it in screenshots. The browser's MetaMask connection works without this optional environment variable, but backend verification will be unavailable until it is set. For a stronger assessment of backend integration, configure it and demonstrate a successful `/api/verify/0x...` response.

Use the endpoint in a browser after receiving a real transaction hash:

```
http://127.0.0.1:5000/api/verify/YOUR_TRANSACTION_HASH
```

The JSON response contains `confirmed`, `success`, `belongs_to_contract`, and `block_number`. Do not claim server-side RPC verification passed if it has not been configured and checked.

## 7. What must be tested

See `tests/TEST_PLAN.md`. At minimum, test: wallet connected, deposit created, release authorized, refund authorized after deadline, refund rejected before deadline, release rejected by seller, duplicate release rejected, zero deposit rejected, invalid address rejected, events and transaction links displayed.

The public Sepolia explorer (for example https://sepolia.etherscan.io/) is independent evidence that blockchain transactions occurred.

## 8. What to submit

According to the SC6113 assignment brief, submit a **5–8 page PDF**, all source files (`.sol`, `.py`, `.html`, `.js`, `.css`), README, and screenshots. The database is optional and this starter does not use one. A recording is not required. Confirm the submission platform's preferred folder/ZIP arrangement with the course instructions.

**Academic integrity:** Learn the critical functions and change/personalize the design, explanations, interface, and tests. Cite external libraries and tutorials in your report as appropriate. Do not claim tests, deployments, or performance you did not actually run.

## 9. Backend unit tests (after installing requirements)

Run this in the project folder:

```bash
python -m unittest discover -s tests -v
```

These are validation and HTTP endpoint tests using Flask's built-in test client; they do **not** replace on-chain Solidity or wallet tests.
