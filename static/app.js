// Client side: MetaMask signs; Flask validates and serves config; blockchain holds funds.
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm";

const ABI = [
  "function createEscrow(address seller,uint64 refundAfter) payable returns (uint256)",
  "function releasePayment(uint256 escrowId)",
  "function refundPayment(uint256 escrowId)",
  "function getEscrow(uint256 escrowId) view returns (address buyer,address seller,uint256 amount,uint64 refundAfter,uint8 status)",
  "function getUserEscrows(address participant) view returns (uint256[])",
  "event EscrowCreated(uint256 indexed escrowId,address indexed buyer,address indexed seller,uint256 amount,uint64 refundAfter)",
  "event EscrowReleased(uint256 indexed escrowId,address indexed buyer,address indexed seller,uint256 amount)",
  "event EscrowRefunded(uint256 indexed escrowId,address indexed buyer,address indexed seller,uint256 amount)"
];
const CHAIN_ID_HEX = "0xaa36a7"; // 11155111 = Ethereum Sepolia.
let config, provider, signer, contract, account;
const $ = (id) => document.getElementById(id);
const compact = (a) => a ? `${a.slice(0, 8)}…${a.slice(-6)}` : "—";
const explorer = (hash) => `https://sepolia.etherscan.io/tx/${hash}`;
const statusLabels = ["Unknown", "Funded", "Released", "Refunded"];

function notice(message, level = "") {
  $("notice").className = `notice ${level}`;
  $("notice").textContent = message;
}
function explainError(error) {
  if (error?.code === "ACTION_REJECTED" || error?.code === 4001) return "Transaction was rejected in MetaMask.";
  return error?.shortMessage || error?.reason || error?.message || String(error);
}
function makeText(tag, content, className = "") {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  return element;
}
function makeLink(hash) {
  const link = document.createElement("a");
  link.href = explorer(hash);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = compact(hash);
  return link;
}
async function init() {
  const result = await fetch("/api/config");
  config = await result.json();
  if (!ethers.isAddress(config.contract_address)) {
    notice("Step 1: deploy FairHoldEscrow.sol in Remix to Sepolia, then enter the address in config.json.");
  } else {
    notice("Contract configured. Connect MetaMask to create or inspect escrows.");
  }
  const dt = new Date(Date.now() + 10 * 60 * 1000);
  // datetime-local expects local time rather than UTC.
  $("deadline").value = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
async function ensureSepolia() {
  if (!window.ethereum) throw new Error("MetaMask browser extension was not found.");
  let current = await window.ethereum.request({ method: "eth_chainId" });
  if (current.toLowerCase() !== CHAIN_ID_HEX) {
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
    } catch (error) {
      if (error.code === 4902) throw new Error("Add Ethereum Sepolia to MetaMask, then try again.");
      throw error;
    }
    current = await window.ethereum.request({ method: "eth_chainId" });
    if (current.toLowerCase() !== CHAIN_ID_HEX) throw new Error("Please switch to Sepolia.");
  }
}
async function connect() {
  try {
    if (!ethers.isAddress(config?.contract_address)) throw new Error("Deploy the contract and configure its address first.");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await ensureSepolia();
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    contract = new ethers.Contract(config.contract_address, ABI, signer);
    $("account").textContent = `Connected: ${compact(account)}`;
    $("connect").textContent = "Wallet connected";
    notice("Connected to Sepolia. All payments use test ETH.", "success");
    await refresh();
  } catch (error) { notice(explainError(error), "error"); }
}
async function send(label, transactionPromise) {
  try {
    notice(`${label}: please confirm in MetaMask.`);
    const tx = await transactionPromise();
    notice(`${label}: submitted ${tx.hash}. Waiting for confirmation…`);
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) throw new Error("The transaction reverted or was replaced.");
    notice(`${label}: confirmed! Transaction ${tx.hash} (view on Sepolia Etherscan).`, "success");
    await refresh();
    try {
      const response = await fetch(`/api/verify/${tx.hash}`);
      if (response.ok) {
        const check = await response.json();
        if (!(check.confirmed && check.success && check.belongs_to_contract)) {
          notice("Wallet reported confirmation, but the backend verification result needs review.", "error");
        }
      }
    } catch (_) { /* RPC-backed backend verification is optional; wallet receipt remains visible. */ }
  } catch (error) { notice(`${label}: ${explainError(error)}`, "error"); }
}
async function createEscrow(event) {
  event.preventDefault();
  if (!account) return notice("Connect MetaMask first.", "error");
  const seller = $("seller").value.trim();
  const amountEth = $("amount").value.trim();
  const refundAfter = Math.floor(new Date($("deadline").value).getTime() / 1000);
  if (!ethers.isAddress(seller)) return notice("The seller address is invalid.", "error");
  if (!Number.isSafeInteger(refundAfter)) return notice("Enter a valid deadline.", "error");
  try {
    const response = await fetch("/api/validate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seller, buyer: account, amount_eth: amountEth, refund_after: refundAfter })
    });
    const preview = await response.json();
    if (!response.ok) throw new Error(preview.error || "Backend rejected the escrow parameters.");
    const wei = ethers.parseEther(amountEth);
    if (wei !== BigInt(preview.amount_wei)) throw new Error("Amount mismatch between backend and wallet.");
    await send("Create escrow", () => contract.createEscrow(seller, refundAfter, { value: wei }));
  } catch (error) { notice(explainError(error), "error"); }
}
async function refresh() {
  if (!contract || !account) return;
  try { await loadEscrows(); } catch (e) { notice(`Unable to load escrows: ${explainError(e)}`, "error"); }
  try { await loadHistory(); } catch (e) { $("history-warning").textContent = `Unable to load event history: ${explainError(e)}. Check RPC range and deployment_block.`; }
}
async function loadEscrows() {
  const ids = await contract.getUserEscrows(account);
  const root = $("escrows"); root.replaceChildren();
  if (ids.length === 0) { root.append(makeText("p", "No escrows for this wallet yet.")); return; }
  for (const id of [...ids].reverse()) {
    const item = await contract.getEscrow(id);
    const [buyer, seller, amount, deadline, state] = item;
    const numericState = Number(state);
    const card = makeText("div", "", "escrow-card");
    const details = document.createElement("div");
    details.append(makeText("strong", `Escrow #${id.toString()} · ${ethers.formatEther(amount)} ETH`));
    details.append(makeText("p", `Buyer: ${compact(buyer)} · Seller: ${compact(seller)}`, "small"));
    details.append(makeText("p", `Refund deadline: ${new Date(Number(deadline) * 1000).toLocaleString()}`, "small"));
    details.append(makeText("span", statusLabels[numericState], `tag ${statusLabels[numericState].toLowerCase()}`));
    card.append(details);
    const actions = makeText("div", "", "escrow-actions");
    if (numericState === 1 && buyer.toLowerCase() === account.toLowerCase()) {
      const release = makeText("button", "Release to seller", "primary");
      release.addEventListener("click", () => send(`Release escrow #${id}`, () => contract.releasePayment(id)));
      actions.append(release);
      if (Date.now() >= Number(deadline) * 1000) {
        const refund = makeText("button", "Refund buyer", "secondary");
        refund.addEventListener("click", () => send(`Refund escrow #${id}`, () => contract.refundPayment(id)));
        actions.append(refund);
      }
    }
    card.append(actions); root.append(card);
  }
}
async function loadHistory() {
  const tbody = $("activity"); tbody.replaceChildren(); $("history-warning").textContent = "";
  const latest = await provider.getBlockNumber();
  const start = Number(config.deployment_block) > 0 ? Number(config.deployment_block) : Math.max(0, latest - 5000);
  if (!config.deployment_block) $("history-warning").textContent = "deployment_block is unset: event search is limited to the newest 5,000 blocks.";
  const filters = [
    contract.filters.EscrowCreated(null, account),
    contract.filters.EscrowCreated(null, null, account),
    contract.filters.EscrowReleased(null, account),
    contract.filters.EscrowReleased(null, null, account),
    contract.filters.EscrowRefunded(null, account),
    contract.filters.EscrowRefunded(null, null, account)
  ];
  const all = (await Promise.all(filters.map(f => contract.queryFilter(f, start, latest)))).flat();
  const unique = [...new Map(all.map(e => [`${e.transactionHash}-${e.index}`, e])).values()];
  unique.sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index);
  if (!unique.length) {
    const tr = document.createElement("tr"); const td = makeText("td", "No matching on-chain events yet.");
    td.colSpan = 4; tr.append(td); tbody.append(tr); return;
  }
  for (const e of unique.slice(0, 60)) {
    if (!e.args) continue;
    const tr = document.createElement("tr");
    tr.append(makeText("td", e.fragment.name.replace("Escrow", "")));
    tr.append(makeText("td", `#${e.args[0].toString()}`));
    tr.append(makeText("td", `${ethers.formatEther(e.args[3])} ETH`));
    const td = document.createElement("td"); td.append(makeLink(e.transactionHash)); tr.append(td);
    tbody.append(tr);
  }
}

$("connect").addEventListener("click", connect);
$("refresh").addEventListener("click", refresh);
$("create-form").addEventListener("submit", createEscrow);
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}
init().catch(e => notice(`Could not initialize: ${explainError(e)}`, "error"));
