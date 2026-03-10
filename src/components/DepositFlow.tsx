import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Wallet, 
  Lock, 
  Check, 
  Search,
  CreditCard,
  Bitcoin,
  Smartphone,
  Banknote,
  Percent,
  Info,
  Copy,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface DepositFlowProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol: string;
  currencyCode: string;
  initialPromoCode?: string | null;
  socket?: any;
  userEmail?: string;
  rawBalance?: number;
  userId?: string;
}

type Step = 'PAYMENT_METHOD' | 'PAYMENT_DETAILS' | 'CONFIRMATION';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'POPULAR' | 'E-PAY' | 'CRYPTO';
  minAmount: string;
  isPopular?: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'binance_pay', name: 'Binance Pay', icon: <div className="w-8 h-8 bg-[#f3ba2f] rounded-full flex items-center justify-center text-[12px] font-bold text-black">B</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'bkash_p2c', name: 'Bkash (P2C)', icon: <div className="w-8 h-8 bg-[#e2136e] rounded flex items-center justify-center text-[12px] font-bold text-white">b</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'nagad_p2c', name: 'Nagad (P2C)', icon: <div className="w-8 h-8 bg-[#f7941d] rounded flex items-center justify-center text-[12px] font-bold text-white">N</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'rocket_p2c', name: 'Rocket (P2C)', icon: <div className="w-8 h-8 bg-[#8c1515] rounded flex items-center justify-center text-[12px] font-bold text-white">R</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'upay_p2c', name: 'Upay (P2C)', icon: <div className="w-8 h-8 bg-[#00529b] rounded flex items-center justify-center text-[12px] font-bold text-white">U</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'usdt_bep20', name: 'USDT (BEP-20)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'usdt_trc20', name: 'USDT (TRC-20)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'usdc_bep20', name: 'USDC (BEP-20)', icon: <div className="w-8 h-8 bg-[#2775ca] rounded-full flex items-center justify-center text-[12px] font-bold text-white">U</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  { id: 'dogecoin', name: 'Dogecoin', icon: <div className="w-8 h-8 bg-[#c2a633] rounded-full flex items-center justify-center text-[12px] font-bold text-white">D</div>, category: 'POPULAR', minAmount: '$15.00', isPopular: true },
  { id: 'usdt_polygon', name: 'USDT (Polygon)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'POPULAR', minAmount: '$10.00', isPopular: true },
  
  { id: 'bkash_e', name: 'Bkash (P2C)', icon: <div className="w-8 h-8 bg-[#e2136e] rounded flex items-center justify-center text-[12px] font-bold text-white">b</div>, category: 'E-PAY', minAmount: '$10.00' },
  { id: 'nagad_e', name: 'Nagad (P2C)', icon: <div className="w-8 h-8 bg-[#f7941d] rounded flex items-center justify-center text-[12px] font-bold text-white">N</div>, category: 'E-PAY', minAmount: '$10.00' },
  { id: 'rocket_e', name: 'Rocket (P2C)', icon: <div className="w-8 h-8 bg-[#8c1515] rounded flex items-center justify-center text-[12px] font-bold text-white">R</div>, category: 'E-PAY', minAmount: '$10.00' },
  { id: 'upay_e', name: 'Upay (P2C)', icon: <div className="w-8 h-8 bg-[#00529b] rounded flex items-center justify-center text-[12px] font-bold text-white">U</div>, category: 'E-PAY', minAmount: '$10.00' },
  
  { id: 'binance_pay_c', name: 'Binance Pay', icon: <div className="w-8 h-8 bg-[#f3ba2f] rounded-full flex items-center justify-center text-[12px] font-bold text-black">B</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'usdt_trc20_c', name: 'USDT (TRC-20)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: <div className="w-8 h-8 bg-[#f7931a] rounded-full flex items-center justify-center text-[12px] font-bold text-white">B</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'ethereum', name: 'Ethereum (ETH)', icon: <div className="w-8 h-8 bg-[#627eea] rounded-full flex items-center justify-center text-[12px] font-bold text-white">E</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'litecoin', name: 'Litecoin (LTC)', icon: <div className="w-8 h-8 bg-[#345d9d] rounded-full flex items-center justify-center text-[12px] font-bold text-white">L</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'usdt_erc20_c', name: 'USDT (ERC-20)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'usdt_polygon_c', name: 'USDT (Polygon)', icon: <div className="w-8 h-8 bg-[#26a17b] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'usdc_erc20_c', name: 'USDC (ERC-20)', icon: <div className="w-8 h-8 bg-[#2775ca] rounded-full flex items-center justify-center text-[12px] font-bold text-white">U</div>, category: 'CRYPTO', minAmount: '$10.00' },
  { id: 'bitcoin_cash', name: 'Bitcoin Cash', icon: <div className="w-8 h-8 bg-[#8dc351] rounded-full flex items-center justify-center text-[12px] font-bold text-white">B</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'tron', name: 'Tron (TRX)', icon: <div className="w-8 h-8 bg-[#ef0027] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'dash', name: 'Dash', icon: <div className="w-8 h-8 bg-[#008ce7] rounded-full flex items-center justify-center text-[12px] font-bold text-white">D</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'polygon', name: 'Polygon (MATIC)', icon: <div className="w-8 h-8 bg-[#8247e5] rounded-full flex items-center justify-center text-[12px] font-bold text-white">P</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'dai', name: 'Dai', icon: <div className="w-8 h-8 bg-[#f5ac37] rounded-full flex items-center justify-center text-[12px] font-bold text-white">D</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'solana', name: 'Solana', icon: <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[12px] font-bold text-white">S</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'shiba_inu', name: 'Shiba Inu (ERC-20)', icon: <div className="w-8 h-8 bg-[#ffa409] rounded-full flex items-center justify-center text-[12px] font-bold text-white">S</div>, category: 'CRYPTO', minAmount: '$100.00' },
  { id: 'ripple', name: 'Ripple', icon: <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[12px] font-bold text-white">R</div>, category: 'CRYPTO', minAmount: '$15.00' },
  { id: 'ton', name: 'The Open Network (TON)', icon: <div className="w-8 h-8 bg-[#0088cc] rounded-full flex items-center justify-center text-[12px] font-bold text-white">T</div>, category: 'CRYPTO', minAmount: '$15.00' },
];

const PRESET_AMOUNTS = [10, 20, 50, 100, 250, 500];

const PROMO_CODES = [
  { code: 'LUNAR2026', description: 'Use LUNAR2026 when depositing $10+', bonus: '110%', expires: 'Mar 9' },
  { code: 'UE5QMQZ0E8', description: 'Use UE5QMQZ0E8 when depositing $250+', bonus: 'UP TO 100%', expires: 'Mar 9', title: 'Advanced Status' },
  { code: 'ONPAY', description: 'Use ONPAY when depositing $15+', bonus: 'UP TO 100%', expires: 'Mar 13', title: 'Deposit Bonus' },
];

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  BDT: 110,
  EUR: 0.92,
  INR: 83,
  PKR: 278,
  GBP: 0.79,
  CAD: 1.35,
  AUD: 1.52,
  JPY: 150,
  TRY: 31,
  BRL: 5,
  IDR: 15600,
  VND: 24600
};

export default function DepositFlow({ isOpen, onClose, currencySymbol, currencyCode, initialPromoCode, socket, userEmail, rawBalance, userId }: DepositFlowProps) {
  const [step, setStep] = useState<Step>('PAYMENT_METHOD');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const minDeposit = currencyCode === 'BDT' ? 500 : 10;
  const [amount, setAmount] = useState<number>(minDeposit);
  const [selectedPromo, setSelectedPromo] = useState<string | null>(initialPromoCode ? 'ACTIVE' : null);
  const [promoInput, setPromoInput] = useState<string>(initialPromoCode || '');
  const [depositSettings, setDepositSettings] = useState({
    bkashNumbers: ['01712-345678'],
    nagadNumbers: ['01712-345678'],
    rocketNumbers: ['01712-345678'],
    upayNumbers: ['01712-345678'],
    exchangeRate: 120,
    depositNote: 'Ensure you include your account ID in the reference if required. Deposits usually reflect within 5-15 minutes.',
    minDepositForBonus: 50,
    bonusPercentage: 10
  });
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (socket) {
      socket.emit('get-deposit-settings');
      socket.on('deposit-settings', (settings: any) => {
        if (settings) setDepositSettings(prev => ({ ...prev, ...settings }));
      });
    }
    return () => {
      if (socket) socket.off('deposit-settings');
    };
  }, [socket]);

  useEffect(() => {
    if (initialPromoCode) {
      setSelectedPromo('ACTIVE');
      setPromoInput(initialPromoCode);
    }
  }, [initialPromoCode]);
  const [activeCategory, setActiveCategory] = useState<'POPULAR' | 'E-PAY' | 'CRYPTO'>('POPULAR');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [depositStatus, setDepositStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');

  if (!isOpen) return null;

  const handleBack = () => {
    if (step === 'PAYMENT_METHOD') onClose();
    else if (step === 'CONFIRMATION') onClose();
    else if (step === 'PAYMENT_DETAILS') setStep('PAYMENT_METHOD');
    else setStep('PAYMENT_METHOD');
  };

  const handleSubmitDeposit = () => {
    if (!transactionId) return;
    
    setIsProcessing(true);
    
    // Simulate instant deposit success for better UX
    setTimeout(async () => {
      setIsProcessing(false);
      setDepositStatus('SUCCESS');
      setStep('CONFIRMATION');
      
      // Update balance in Firestore instantly
      if (userId && rawBalance !== undefined) {
        try {
          const userRef = doc(db, 'users', userId);
          const rate = EXCHANGE_RATES[currencyCode] || 1;
          const amountInUSD = amount / rate;
          await updateDoc(userRef, {
            balance: rawBalance + amountInUSD
          });
        } catch (error) {
          console.error("Error updating balance:", error);
        }
      }

      if (socket && userEmail) {
        socket.emit('submit-deposit', {
          email: userEmail,
          amount: amount,
          currency: currencyCode,
          method: selectedMethod.id,
          transactionId
        });
      }
    }, 2000);
  };

const PaymentMethods = ({ onClose, selectedMethod, setSelectedMethod, amount, setAmount, amountError, setAmountError, currencyCode, currencySymbol, minDeposit, depositSettings, selectedPromo, setSelectedPromo, promoInput, setPromoInput, setStep }: any) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMethods = PAYMENT_METHODS.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Top up account</h2>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-[var(--text-primary)]/5 rounded-full transition">
            <X size={24} className="text-[var(--text-primary)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Replenishment Method */}
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-secondary)] font-medium">Replenishment method</label>
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-color)] flex items-center justify-between text-[var(--text-primary)] font-bold"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {selectedMethod.icon}
                  </div>
                  {selectedMethod.name}
                </div>
                <ChevronRight size={20} className={cn("text-[var(--text-secondary)] transition-transform", isDropdownOpen && "rotate-90")} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-2 z-50 shadow-2xl max-h-[300px] overflow-y-auto"
                  >
                    <div className="p-2 mb-2 bg-[var(--bg-primary)] rounded-xl flex items-center gap-2 border border-[var(--border-color)]">
                      <Search size={18} className="text-[var(--text-secondary)]" />
                      <input 
                        type="text"
                        placeholder="Search by deposit method"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-[var(--text-primary)] text-sm focus:outline-none w-full"
                      />
                    </div>
                    {filteredMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setSelectedMethod(method);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-[var(--text-primary)] font-bold text-sm transition",
                          selectedMethod.id === method.id ? "bg-[#22c55e]/20 text-[#22c55e]" : "hover:bg-[var(--text-primary)]/5"
                        )}
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          {method.icon}
                        </div>
                        {method.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Preset Amounts */}
          <div className="grid grid-cols-4 gap-2">
            {(currencyCode === 'BDT' ? [500, 1000, 2000, 5000] : [10, 20, 50, 100]).map(val => (
              <button
                key={val}
                onClick={() => {
                  setAmount(val);
                  setAmountError(null);
                }}
                className={cn(
                  "p-3 rounded-xl border transition font-bold text-xs",
                  amount === val ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)]"
                )}
              >
                {currencySymbol}{val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className={`bg-[var(--bg-primary)] rounded-2xl p-4 border ${amountError ? 'border-red-500' : 'border-[var(--border-color)]'} focus-within:border-[#22c55e]/50 transition`}>
            <div className="text-xs text-[var(--text-secondary)] font-medium mb-1">Amount (min. {currencySymbol}{minDeposit.toLocaleString()}, max. {currencySymbol}{(minDeposit * 1000).toLocaleString()})</div>
            <div className="flex items-center justify-between">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAmount(val);
                  if (val < minDeposit) {
                    setAmountError(`Minimum deposit is ${currencySymbol}${minDeposit}`);
                  } else if (val > minDeposit * 1000) {
                    setAmountError(`Maximum deposit is ${currencySymbol}${minDeposit * 1000}`);
                  } else {
                    setAmountError(null);
                  }
                }}
                className="w-full bg-transparent text-2xl font-bold text-[var(--text-primary)] focus:outline-none"
              />
              <span className="text-[var(--text-secondary)] font-bold">{currencyCode}</span>
            </div>
            {['bkash', 'nagad', 'rocket', 'upay'].some(m => selectedMethod.id.includes(m)) && currencyCode !== 'BDT' && amount > 0 && (
              <div className="mt-2 text-xs font-bold text-blue-500 bg-blue-500/10 inline-block px-2 py-1 rounded">
                ≈ ৳{(amount * (depositSettings.exchangeRate || 120)).toLocaleString()} BDT
              </div>
            )}
          </div>
          {amountError && <p className="text-xs text-red-500 font-bold">{amountError}</p>}

          {/* Bonus Section */}
          <div className="bg-[var(--bg-primary)] rounded-2xl p-4 border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-500">
                <Percent size={20} />
                <span className="font-bold">Activate bonus</span>
              </div>
              <button 
                onClick={() => setSelectedPromo(selectedPromo ? null : 'ACTIVE')}
                className={cn("w-12 h-6 rounded-full relative transition-colors", selectedPromo ? "bg-[#22c55e]" : "bg-gray-700")}
              >
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", selectedPromo ? "right-1" : "left-1")} />
              </button>
            </div>
            
            {selectedPromo && (
              <div className="space-y-2">
                <input 
                  type="text"
                  placeholder="Enter promocode"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] rounded-xl p-3 text-[var(--text-primary)] text-sm focus:outline-none border border-[var(--border-color)]"
                />
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>Bonus amount:</span>
                  <span className={amount >= (depositSettings.minDepositForBonus || 50) ? "text-emerald-500 font-bold" : ""}>
                    {amount >= (depositSettings.minDepositForBonus || 50) 
                      ? `+${currencySymbol}${(amount * ((depositSettings.bonusPercentage || 10) / 100)).toFixed(2)}` 
                      : `Min. ${currencySymbol}${depositSettings.minDepositForBonus || 50} required`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[var(--text-primary)]">
                  <span>Total Amount:</span>
                  <span>
                    {currencySymbol}
                    {amount >= (depositSettings.minDepositForBonus || 50) 
                      ? (amount + (amount * ((depositSettings.bonusPercentage || 10) / 100))).toFixed(2) 
                      : amount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button 
            disabled={!!amountError || amount < minDeposit}
            onClick={() => setStep('PAYMENT_DETAILS')}
            className={cn(
              "w-full font-black py-4 rounded-2xl transition active:scale-[0.98]",
              (!amountError && amount >= minDeposit) ? "bg-[#22c55e] text-black hover:bg-[#22c55e]/90 shadow-[0_8px_24px_rgba(34,197,94,0.2)]" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-not-allowed"
            )}
          >
            Go to payment page
          </button>
        </div>
      </div>
    );
  };

const PaymentDetails = ({ handleBack, selectedMethod, amount, currencyCode, currencySymbol, depositSettings, transactionId, setTransactionId, handleSubmitDeposit, isProcessing }: any) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
              console.error('Failed to copy using clipboard API: ', err);
              fallbackCopyTextToClipboard(text);
            });
        } else {
          fallbackCopyTextToClipboard(text);
        }
      };
    
      const fallbackCopyTextToClipboard = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
    
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
    
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            console.error('Fallback: Copying text command was unsuccessful');
          }
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
        }
    
        document.body.removeChild(textArea);
      };

    const isLocalMethod = ['bkash', 'nagad', 'rocket', 'upay'].some(m => selectedMethod.id.includes(m));
    const needsConversion = isLocalMethod && currencyCode !== 'BDT';
    const exchangeRate = depositSettings.exchangeRate || 120;
    const localAmount = needsConversion ? amount * exchangeRate : amount;
    const displayCurrency = needsConversion ? 'BDT' : currencyCode;
    const displaySymbol = needsConversion ? '৳' : currencySymbol;

    return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <button onClick={handleBack} className="p-2 -ml-2 hover:bg-[var(--text-primary)]/5 rounded-full transition">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Payment Details</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-[var(--bg-primary)] rounded-2xl p-6 border border-[var(--border-color)] space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[var(--text-primary)]/5 flex items-center justify-center mb-2 shadow-inner">
              {selectedMethod.icon}
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{displaySymbol}{localAmount.toLocaleString()}</h3>
              <button 
                onClick={() => handleCopy(localAmount.toString())}
                className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition active:scale-90 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Copy Amount"
              >
                <Copy size={14} />
              </button>
            </div>
            {needsConversion && (
              <div className="bg-blue-500/10 text-blue-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-500/20 mb-2">
                Exchange Rate: 1 {currencyCode} = {exchangeRate} BDT
              </div>
            )}
            <p className="text-xs text-[var(--text-secondary)] font-medium">Please send the exact amount to the account below</p>
          </div>

          <div className="space-y-3">
            <style>{`
              @keyframes shimmer-slide {
                100% { transform: translateX(100%); }
              }
            `}</style>
            {(() => {
              let nums = ['01712-345678'];
              if (selectedMethod.id.includes('bkash') && depositSettings.bkashNumbers?.length > 0) nums = depositSettings.bkashNumbers;
              else if (selectedMethod.id.includes('nagad') && depositSettings.nagadNumbers?.length > 0) nums = depositSettings.nagadNumbers;
              else if (selectedMethod.id.includes('rocket') && depositSettings.rocketNumbers?.length > 0) nums = depositSettings.rocketNumbers;
              else if (selectedMethod.id.includes('upay') && depositSettings.upayNumbers?.length > 0) nums = depositSettings.upayNumbers;
              
              return nums.map((num, idx) => (
                <div key={idx} className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between border border-[var(--border-color)] shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer-slide_1.5s_ease-in-out_infinite]" />
                  <div className="relative z-10">
                    <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-1">Merchant Account {idx + 1}</div>
                    <div className="text-xl font-mono font-black text-[var(--text-primary)] tracking-wider">
                      {num}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCopy(num)}
                    className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--text-primary)]/5 transition active:scale-90 relative z-10 shadow-sm"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check size={18} className="text-[#22c55e]" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy size={18} className="text-[#22c55e]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              ));
            })()}
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-yellow-500 shrink-0" />
            <p className="text-[10px] text-yellow-500/80 leading-relaxed whitespace-pre-wrap">
              {depositSettings.depositNote}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl p-4 border border-[var(--border-color)] focus-within:border-[#22c55e]/50 transition">
            <div className="text-xs text-[var(--text-secondary)] font-medium mb-1">Transaction ID / Reference</div>
            <input 
              type="text" 
              placeholder="Enter 10-digit ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-secondary)]"
            />
          </div>

          <button 
            disabled={!transactionId || isProcessing}
            onClick={handleSubmitDeposit}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2",
              transactionId && !isProcessing 
                ? "bg-[#22c55e] text-black shadow-[0_8px_24px_rgba(34,197,94,0.2)] active:scale-[0.98]" 
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Submit Deposit</span>
            )}
          </button>
        </div>
      </div>
    </div>
    );
  };

const Confirmation = ({ onClose, transactionId, selectedMethod, amount, currencyCode, currencySymbol, localAmount, depositStatus }: any) => {
    return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center space-y-6 bg-[var(--bg-secondary)]">
      {depositStatus === 'SUCCESS' ? (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20"
          >
            <CheckCircle2 size={48} className="text-emerald-500" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[var(--text-primary)]">Deposit Successful!</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[280px]">
              Your deposit of {currencySymbol}{localAmount.toLocaleString()} has been added to your live balance.
            </p>
          </div>
        </>
      ) : (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-[#22c55e]/10 flex items-center justify-center border-2 border-[#22c55e]/20"
          >
            <Clock size={48} className="text-[#22c55e] animate-pulse" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[var(--text-primary)]">Deposit Pending</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[280px]">
              We've received your request for {currencySymbol}{localAmount.toLocaleString()} ({currencySymbol}{amount.toLocaleString()}). Our team is verifying the transaction.
            </p>
          </div>
        </>
      )}

      <div className="w-full bg-[var(--bg-primary)] rounded-2xl p-6 border border-[var(--border-color)] space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--text-secondary)]">Transaction ID</span>
          <span className="text-[var(--text-primary)] font-mono font-bold">{transactionId}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--text-secondary)]">Method</span>
          <span className="text-[var(--text-primary)] font-bold">{selectedMethod.name}</span>
        </div>
        {depositStatus !== 'SUCCESS' && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-secondary)]">Estimated Time</span>
            <span className="text-[#22c55e] font-bold">5-15 Minutes</span>
          </div>
        )}
      </div>

      <button 
        onClick={onClose}
        className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-black py-4 rounded-2xl hover:opacity-90 transition active:scale-[0.98]"
      >
        Back to Trading
      </button>
    </div>
    );
  };

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex flex-col"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {step === 'PAYMENT_METHOD' && <PaymentMethods 
            onClose={onClose} 
            selectedMethod={selectedMethod} 
            setSelectedMethod={setSelectedMethod} 
            amount={amount} 
            setAmount={setAmount} 
            amountError={amountError} 
            setAmountError={setAmountError} 
            currencyCode={currencyCode} 
            currencySymbol={currencySymbol} 
            minDeposit={minDeposit} 
            depositSettings={depositSettings} 
            selectedPromo={selectedPromo} 
            setSelectedPromo={setSelectedPromo} 
            promoInput={promoInput} 
            setPromoInput={setPromoInput} 
            setStep={setStep}
          />}
          {step === 'PAYMENT_DETAILS' && <PaymentDetails 
            handleBack={handleBack} 
            selectedMethod={selectedMethod} 
            amount={amount} 
            currencyCode={currencyCode} 
            currencySymbol={currencySymbol} 
            depositSettings={depositSettings} 
            transactionId={transactionId} 
            setTransactionId={setTransactionId} 
            handleSubmitDeposit={handleSubmitDeposit} 
            isProcessing={isProcessing} 
          />}
          {step === 'CONFIRMATION' && <Confirmation 
            onClose={onClose} 
            transactionId={transactionId} 
            selectedMethod={selectedMethod} 
            amount={amount} 
            currencyCode={currencyCode} 
            currencySymbol={currencySymbol} 
            localAmount={['bkash', 'nagad', 'rocket', 'upay'].some(m => selectedMethod.id.includes(m)) && currencyCode !== 'BDT' ? amount * (depositSettings.exchangeRate || 120) : amount}
            depositStatus={depositStatus}
          />}
        </motion.div>
      </AnimatePresence>

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-[var(--bg-secondary)] p-8 rounded-3xl border border-[var(--border-color)] flex flex-col items-center space-y-4">
              <Loader2 size={40} className="text-[#22c55e] animate-spin" />
              <p className="text-[var(--text-primary)] font-bold">Processing Deposit...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
