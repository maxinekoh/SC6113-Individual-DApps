# SC6113 report outline (5–8 pages PDF, per assignment brief)

This is an outline, not a finished report. Write from your real implementation and real test evidence.

## 1. Introduction + problem statement (approx. 0.75 page)
- Problem: small freelance services paid by people who do not fully trust one another.
- Existing risk: advance payment puts buyer at risk; work-first puts seller at risk.
- Blockchain rationale: smart contract can hold funds and enforce a disclosed payment/refund policy without a payment intermediary; note that an arbitrator could also help resolve off-chain performance disputes.

## 2. Objectives + technologies (approx. 0.5 page)
- Deposit test ETH, release/refund based on rules, wallet authentication, transparent event logs, error validation.
- Ethereum Sepolia, Solidity, MetaMask, ethers.js, Flask, HTML, CSS, JS, Remix.

## 3. System architecture (approx. 0.75 page)
- Browser UI -> Flask for page/configuration/validation/read-only verification.
- Browser MetaMask -> Sepolia smart contract for signed transactions and balance custody.
- Public Ethereum ledger -> event logs, receipts, transaction history.
- Clearly separate **off-chain** Flask validation from **on-chain** rules.
- Include your own architecture diagram.

## 4. Smart contract design (approx. 1 page)
- Escrow states: Funded -> Released OR Funded -> Refunded.
- Data: buyer, seller, amount, refund deadline, status.
- Functions: createEscrow(), releasePayment(), refundPayment(), getEscrow(), getUserEscrows().
- Controls: only buyer releases/refunds; positive deposits; separate addresses; future deadline; no contract administrator; state updated before sending ETH.
- Discuss weaknesses: buyer bias and no adjudication, both parties must trust the code, potential gas and denial-of-service cases involving recipient contracts, testnet only.

## 5. Application implementation + backend (approx. 0.75–1 page)
- Website inputs and wallet connection; ERC-1193 injected wallet through ethers.js BrowserProvider.
- Flask API `/api/validate` and optional `/api/verify/<tx_hash>` using Ethereum RPC.
- Browser displays mined/pending status, contract state and contract-generated events.
- Include interface screenshot.

## 6. Testing, evaluation and results (approx. 1.5 pages)
- Test table with actual outcomes from `tests/TEST_PLAN.md`.
- Screenshots with captions: deployment, funded state, release, refund, error case, Etherscan transaction.
- Discuss usability; compare gas and completion times *only if actually measured*.
- Include evidence of frontend and backend integration.

## 7. Challenges, limitations and improvements (approx. 0.5–0.75 page)
- Real challenge actually encountered (wallet network, RPC event limits, reverts or deadline logic).
- Limitations: no arbitration or proof-of-delivery, testnet-only, not audited, ETH only, seller contract receiving Ether may revert.
- Future: signed seller acceptance, arbitrated dispute process, partial refunds, milestone payments, accessibility, contract audits and production monitoring.

## 8. Conclusion (approx. 0.25 page)
- Summarize what was demonstrated, which results were observed, and the contract's explicit trust assumptions.

**Report requirements from brief:** introduction, problem statement, objectives, system architecture, technologies, smart contract design, application design, implementation, testing/results, challenges, limitations, future improvements, conclusion. Review screenshots and reference sources before submission.
