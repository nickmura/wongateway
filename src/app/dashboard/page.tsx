'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Plus, Copy, ExternalLink, Package, Clock, CheckCircle, Wallet, FileText, ShoppingBag, Store, BookOpen, Filter, AlertCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { parseUnits, erc20Abi } from 'viem';

// Token addresses
const KRW_TOKEN_ADDRESS = '0xb813E193ddE7ba598089C398F677EDfEBb77a5Aa' as `0x${string}`;

interface Invoice {
  id: string;
  productName: string;
  totalAmount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
  customerEmail?: string;
  paymentLink?: string;
  transferHash?: string;
  refundTransferHash?: string;
  refundedAt?: string;
  blockNumber?: number;
  customerWallet?: string;
  tokenAddress?: string;
  gasUsed?: string;
  paidAt?: string;
  merchantWallet?: string;
  expiresAt?: string;
}

interface Merchant {
  id: string;
  walletAddress: string;
  name: string;
  email?: string;
  apiKey: string;
}

interface IntegrationHealth {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'not_configured' | 'configured';
  details: Record<string, unknown> | null;
}

export default function MerchantDashboard() {
  const { address, isConnected } = useAccount();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [integrationHealth, setIntegrationHealth] = useState<{
    shopify: IntegrationHealth;
    woocommerce: IntegrationHealth;
  } | null>(null);

  // Refund transaction hooks
  const { 
    data: refundTxHash,
    writeContract: writeRefund,
    isPending: isRefunding
  } = useWriteContract();

  // Wait for refund transaction confirmation
  const { isLoading: isRefundConfirming, isSuccess: isRefundConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: refundTxHash
    });

  // Get merchant's KRW balance for refunds
  const { data: krwBalance } = useBalance({
    address: address,
    token: KRW_TOKEN_ADDRESS,
  });
  
  // Form state for new invoice
  const [formData, setFormData] = useState({
    productName: '',
    totalAmount: '',
    currency: 'KRW',
    customerEmail: '',
    description: '',
    expiresInHours: '24',
    type: 'DIRECT'
  });
  
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

  const openInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedInvoice(null);
  };

  const fetchMerchantData = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Get or create merchant (always use lowercase)
      const merchantRes = await fetch('/api/merchants/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address.toLowerCase() })
      });
      
      if (merchantRes.ok) {
        const merchantData = await merchantRes.json();
        console.log('Frontend received merchant data:', merchantData);
        setMerchant(merchantData);
        
        // Fetch merchant's invoices (use lowercase)
        const invoicesRes = await fetch(`/api/merchants/invoices?wallet=${address.toLowerCase()}`);
        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json();
          console.log('Fetched invoices:', invoicesData);
          setInvoices(invoicesData);
        }
      }
    } catch (error) {
      console.error('Error fetching merchant data:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const fetchIntegrationHealth = async () => {
    try {
      const response = await fetch('/api/health/integrations');
      if (response.ok) {
        const healthData = await response.json();
        setIntegrationHealth(healthData.integrations);
      }
    } catch (error) {
      console.error('Error fetching integration health:', error);
    }
  };

  const refreshInvoices = async () => {
    if (!address) return;
    
    setRefreshing(true);
    try {
      const invoicesRes = await fetch(`/api/merchants/invoices?wallet=${address.toLowerCase()}`);
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        console.log('Refreshed invoices:', invoicesData);
        setInvoices(invoicesData);
      }
    } catch (error) {
      console.error('Error refreshing invoices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch or create merchant account
  useEffect(() => {
    if (isConnected && address) {
      fetchMerchantData();
      fetchIntegrationHealth();
    } else {
      setMerchant(null);
      setInvoices([]);
      setIntegrationHealth(null);
      setLoading(false);
    }
  }, [isConnected, address, fetchMerchantData]);

  // Handle refund transaction confirmation
  useEffect(() => {
    if (isRefundConfirmed && refundTxHash && selectedInvoice) {
      console.log('Refund confirmed, updating database:', { 
        orderId: selectedInvoice.id, 
        refundTxHash 
      });
      
      // Update order status in database
      fetch('/api/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedInvoice.id,
          refundTransferHash: refundTxHash
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log('Refund API response:', data);
        alert('Refund processed successfully!');
        refreshInvoices();
        closeDetailsModal();
        setIsProcessingRefund(false);
      })
      .catch(error => {
        console.error('Failed to update refund status:', error);
        alert('Refund transaction successful but failed to update status');
        setIsProcessingRefund(false);
      });
    }
  }, [isRefundConfirmed, refundTxHash, selectedInvoice, refreshInvoices, closeDetailsModal]);

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Create invoice clicked', { address, formData });
    
    if (!address) {
      console.error('No wallet address available');
      return;
    }

    try {
      console.log('Sending request to create invoice...');
      const res = await fetch('/api/merchants/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount),
          merchantWallet: address.toLowerCase(),
          type: formData.type,
          expiresInHours: parseInt(formData.expiresInHours)
        })
      });

      console.log('Response status:', res.status);
      
      if (res.ok) {
        const newInvoice = await res.json();
        console.log('Invoice created successfully:', newInvoice);
        setInvoices([newInvoice, ...invoices]);
        setCreatedInvoice(newInvoice); // Store the created invoice to show link
        // Don't close modal immediately, let user see the link
      } else {
        const errorText = await res.text();
        console.error('Error response status:', res.status);
        console.error('Error response text:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          alert(`Error: ${errorData.error || 'Unknown error'}`);
        } catch (jsonError) {
          alert(`Error: ${res.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(`Error creating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setCreatedInvoice(null);
    setFormData({
      productName: '',
      totalAmount: '',
      currency: 'KRW',
      customerEmail: '',
      description: '',
      expiresInHours: '24',
      type: 'DIRECT'
    });
  };

  const copyInvoiceLink = (orderId: string) => {
    const link = `${window.location.origin}/pay?orderId=${orderId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyPaymentLink = (orderId: string) => {
    const link = `${window.location.origin}/pay?orderId=${orderId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFilteredInvoices = () => {
    switch (activeFilter) {
      case 'direct':
        return invoices.filter(invoice => invoice.type === 'DIRECT');
      case 'shopify':
        return invoices.filter(invoice => invoice.type === 'SHOPIFY');
      case 'woocommerce':
        return invoices.filter(invoice => invoice.type === 'WOOCOMMERCE');
      case 'pending':
        return invoices.filter(invoice => invoice.status === 'PENDING');
      case 'paid':
        return invoices.filter(invoice => invoice.status === 'PAID');
      case 'refunded':
        return invoices.filter(invoice => invoice.status === 'REFUNDED');
      default:
        return invoices;
    }
  };

  const filteredInvoices = getFilteredInvoices();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'REFUNDED':
        return 'text-purple-600 bg-purple-100';
      case 'EXPIRED':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'REFUNDED':
        return <RefreshCw className="w-4 h-4" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4" />;
      case 'EXPIRED':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Wallet className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Merchant Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to access your merchant dashboard and create invoices.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Kaia Commerce
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-700">Merchant Dashboard</span>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex-shrink-0`}>
          <div className="p-4">
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mb-6 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>

            {sidebarOpen && (
              <>
                {/* Invoice Categories */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Invoice Types
                  </h3>
                  <nav className="space-y-2">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                      <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {invoices.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveFilter('direct')}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeFilter === 'direct' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Direct Invoices</span>
                      <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {invoices.filter(i => i.type === 'DIRECT').length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveFilter('shopify')}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeFilter === 'shopify' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Shopify</span>
                      <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {invoices.filter(i => i.type === 'SHOPIFY').length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveFilter('woocommerce')}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeFilter === 'woocommerce' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>WooCommerce</span>
                      <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {invoices.filter(i => i.type === 'WOOCOMMERCE').length}
                      </span>
                    </button>
                  </nav>
                </div>

                {/* Status Filters */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Status
                  </h3>
                  <nav className="space-y-2">
                    <button
                      onClick={() => setActiveFilter('pending')}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeFilter === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Pending</span>
                      <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {invoices.filter(i => i.status === 'PENDING').length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveFilter('paid')}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeFilter === 'paid' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Paid</span>
                      <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {invoices.filter(i => i.status === 'PAID').length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveFilter('refunded')}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        activeFilter === 'refunded' ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refunded</span>
                      <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {invoices.filter(i => i.status === 'REFUNDED').length}
                      </span>
                    </button>
                  </nav>
                </div>

                {/* Documentation */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Documentation
                  </h3>
                  <nav className="space-y-2">
                    <a
                      href="https://help.shopify.com/en/manual/orders/notifications/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Shopify Webhooks</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                    <a
                      href="https://woocommerce.github.io/woocommerce-rest-api-docs/?shell#webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>WooCommerce API</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                    <a
                      href="https://kaia-commerce.myshopify.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Store className="w-4 h-4" />
                      <span>Shopify Store Demo</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </a>
                  </nav>
                </div>

                {/* Merchant Info */}
                {merchant && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Account
                    </h3>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="truncate">{merchant.walletAddress}</p>
                      <p>{merchant.name}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">

            {/* Integration Status - Only show on Shopify/WooCommerce pages */}
            {integrationHealth && (activeFilter === 'shopify' || activeFilter === 'woocommerce') && (
              <div className="mb-8">
                <div className="grid grid-cols-1 gap-4">
                  {/* Show Shopify status only on Shopify page */}
                  {activeFilter === 'shopify' && (
                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-l-green-500">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <ShoppingBag className={`w-6 h-6 ${
                            integrationHealth?.shopify?.connected ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-gray-900">Shopify Integration</h3>
                            <p className={`text-sm ${
                              integrationHealth?.shopify?.connected ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {integrationHealth?.shopify?.connected ? 'Connected' : 
                               integrationHealth?.shopify?.status === 'not_configured' ? 'Not Configured' : 'Disconnected'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {integrationHealth?.shopify?.connected ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                      </div>
                      {integrationHealth?.shopify?.connected && integrationHealth?.shopify?.details?.shopName ? (
                        <div className="mt-2 text-xs text-gray-600">
                          Store: {String(integrationHealth.shopify.details.shopName)}
                        </div>
                      ) : null}
                      {!integrationHealth?.shopify?.connected && (
                        <div className="mt-2 text-xs text-gray-500">
                          <p>To connect your Shopify store, please follow the example repository</p>
                          <a 
                            href="https://github.com/nickmura/kaia-commerce" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            View Setup Guide →
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show WooCommerce status only on WooCommerce page */}
                  {activeFilter === 'woocommerce' && (
                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-l-purple-500">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Store className={`w-6 h-6 ${
                            integrationHealth?.woocommerce?.connected ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-gray-900">WooCommerce Integration</h3>
                            <p className={`text-sm ${
                              integrationHealth?.woocommerce?.connected ? 'text-purple-600' : 'text-gray-500'
                            }`}>
                              {integrationHealth?.woocommerce?.connected ? 'Configured' : 
                               integrationHealth?.woocommerce?.status === 'not_configured' ? 'Not Configured' : 'Disconnected'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {integrationHealth?.woocommerce?.connected ? (
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                      </div>
                      {/* API Key Configuration Section */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Plugin Configuration</h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">API Key (for WooCommerce plugin):</p>
                            <div className="flex items-center space-x-2">
                              <input
                                type={showApiKey ? "text" : "password"}
                                readOnly
                                value={merchant?.apiKey || 'Loading...'}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50 font-mono"
                              />
                              <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                              >
                                {showApiKey ? 'Hide' : 'Show'}
                              </button>
                              <button
                                onClick={() => {
                                  if (merchant?.apiKey) {
                                    navigator.clipboard.writeText(merchant.apiKey);
                                    setCopiedId('apikey');
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }
                                }}
                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                  copiedId === 'apikey'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                {copiedId === 'apikey' ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Use this API key in your WooCommerce plugin configuration to connect your store.
                          </p>
                        </div>
                      </div>
                      
                      {!integrationHealth?.woocommerce?.connected && (
                        <div className="mt-2 text-xs text-gray-500">
                          <p>To connect your WooCommerce store, please follow the example repository</p>
                          <a 
                            href="https://github.com/nickmura/kaia-commerce" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            View Setup Guide →
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {activeFilter === 'all' ? 'Total Invoices' : 'Filtered Results'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{filteredInvoices.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paid Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {invoices.filter(i => i.status === 'PAID').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {invoices.filter(i => i.status === 'PENDING').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {activeFilter === 'all' ? 'All Invoices' : 
                 activeFilter === 'direct' ? 'Direct Invoices' :
                 activeFilter === 'shopify' ? 'Shopify Orders' :
                 activeFilter === 'woocommerce' ? 'WooCommerce Orders' :
                 activeFilter === 'pending' ? 'Pending Invoices' :
                 activeFilter === 'paid' ? 'Paid Invoices' : 
                 activeFilter === 'refunded' ? 'Refunded Invoices' : 'Invoices'}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshInvoices}
                  disabled={refreshing}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    refreshing
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Refresh invoice list"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={activeFilter === 'shopify' || activeFilter === 'woocommerce'}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeFilter === 'shopify' || activeFilter === 'woocommerce'
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title={
                    activeFilter === 'shopify' || activeFilter === 'woocommerce'
                      ? 'Invoices for this platform are created automatically via webhooks'
                      : 'Create a new invoice'
                  }
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Direct Invoice</span>
                </button>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No invoices yet</p>
              <p className="text-sm text-gray-500 mt-2">Create your first invoice to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openInvoiceDetails(invoice)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.totalAmount} {invoice.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span>{invoice.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => copyPaymentLink(invoice.id)}
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              copiedId === invoice.id
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                            title="Copy payment link"
                          >
                            {copiedId === invoice.id ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <Link
                            href={`/pay?orderId=${invoice.id}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Open payment page"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            {!createdInvoice ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create Direct Invoice</h3>
                <form onSubmit={createInvoice}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Premium Service"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.totalAmount}
                          onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="100.00"
                        />
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="KRW">KRW</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="DIRECT">Direct Invoice</option>
                        <option value="SHOPIFY">Shopify Order</option>
                        <option value="WOOCOMMERCE">WooCommerce Order</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expires In (Hours)
                        {(formData.type === 'SHOPIFY' || formData.type === 'WOOCOMMERCE') && (
                          <span className="text-xs text-gray-500 ml-2">(Managed by platform)</span>
                        )}
                      </label>
                      <select
                        value={formData.expiresInHours}
                        onChange={(e) => setFormData({ ...formData, expiresInHours: e.target.value })}
                        disabled={formData.type === 'SHOPIFY' || formData.type === 'WOOCOMMERCE'}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          (formData.type === 'SHOPIFY' || formData.type === 'WOOCOMMERCE') 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : ''
                        }`}
                      >
                        <option value="1">1 Hour</option>
                        <option value="6">6 Hours</option>
                        <option value="12">12 Hours</option>
                        <option value="24">24 Hours (Default)</option>
                        <option value="48">48 Hours</option>
                        <option value="72">72 Hours</option>
                        <option value="168">1 Week</option>
                        <option value="0">Never Expires</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="customer@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Invoice description..."
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Create Invoice
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Invoice Created!</h3>
                  <p className="text-gray-600">Your payment link is ready to share</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Invoice Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">ID:</span> {createdInvoice.id.slice(0, 12)}...</p>
                    <p><span className="font-medium">Type:</span> {formData.type}</p>
                    <p><span className="font-medium">Product:</span> {formData.productName}</p>
                    <p><span className="font-medium">Amount:</span> {formData.totalAmount} {formData.currency}</p>
                    <p><span className="font-medium">Expires:</span> {
                      (formData.type === 'SHOPIFY' || formData.type === 'WOOCOMMERCE') 
                        ? 'Managed by platform' 
                        : (formData.expiresInHours === '0' ? 'Never' : `${formData.expiresInHours} hours`)
                    }</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Link
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/pay?orderId=${createdInvoice.id}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyInvoiceLink(createdInvoice.id)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                        copiedId === createdInvoice.id
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      title="Copy link"
                    >
                      {copiedId === createdInvoice.id ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  {copiedId === createdInvoice.id && (
                    <p className="text-sm text-green-600 mt-2">✓ Link copied to clipboard!</p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    href={`/pay?orderId=${createdInvoice.id}`}
                    target="_blank"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                  >
                    View Invoice
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              <span className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.status)}`}>
                {getStatusIcon(selectedInvoice.status)}
                <span>{selectedInvoice.status}</span>
              </span>
            </div>

            {/* Invoice Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Invoice ID</p>
                    <p className="text-sm font-medium text-gray-900 font-mono">{selectedInvoice.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm font-medium text-gray-900">{selectedInvoice.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Product Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedInvoice.productName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-medium text-gray-900">{selectedInvoice.totalAmount} {selectedInvoice.currency}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Customer Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedInvoice.customerEmail || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer Wallet</p>
                    <p className="text-sm font-medium text-gray-900 font-mono">
                      {selectedInvoice.customerWallet || 'Not connected yet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedInvoice.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedInvoice.paidAt && (
                    <div>
                      <p className="text-xs text-gray-500">Paid Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedInvoice.paidAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedInvoice.expiresAt && selectedInvoice.type === 'DIRECT' && (
                    <div>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedInvoice.expiresAt) > new Date() ? 'Expires' : 'Expired'}
                      </p>
                      <p className={`text-sm font-medium ${
                        new Date(selectedInvoice.expiresAt) > new Date() 
                          ? 'text-gray-900' 
                          : 'text-red-600'
                      }`}>
                        {new Date(selectedInvoice.expiresAt).toLocaleString()}
                        {new Date(selectedInvoice.expiresAt) < new Date() && ' ⚠️'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction Information - Only show if paid */}
            {selectedInvoice.transferHash && (
              <div className="border-t pt-6 mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Transaction Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Payment Transaction Hash</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm font-medium text-gray-900 font-mono truncate flex-1">
                        {selectedInvoice.transferHash}
                      </p>
                      <a
                        href={`https://kairos.kaiascan.io/tx/${selectedInvoice.transferHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Explorer
                      </a>
                      {selectedInvoice.status === 'PAID' && !selectedInvoice.refundTransferHash && (
                        <button
                          onClick={async () => {
                            if (!selectedInvoice.customerWallet) {
                              alert('Cannot refund: Customer wallet address not found');
                              return;
                            }

                            if (window.confirm('Are you sure you want to refund this payment? This will send funds back to the customer\'s wallet.')) {
                              setIsProcessingRefund(true);
                              
                              try {
                                // Calculate refund amount in token units (assuming 18 decimals for KRW token)
                                const refundAmount = parseUnits(selectedInvoice.totalAmount.toString(), 18);
                                
                                // Check merchant has sufficient balance
                                if (krwBalance && krwBalance.value < refundAmount) {
                                  alert('Insufficient KRW balance to process refund');
                                  setIsProcessingRefund(false);
                                  return;
                                }
                                
                                // Determine which token to refund (KRW or native KAIA)
                                const isKRWPayment = selectedInvoice.currency === 'KRW' || 
                                                     selectedInvoice.tokenAddress === KRW_TOKEN_ADDRESS;
                                
                                if (isKRWPayment) {
                                  // Refund KRW tokens
                                  writeRefund({
                                    address: KRW_TOKEN_ADDRESS,
                                    abi: erc20Abi,
                                    functionName: 'transfer',
                                    args: [selectedInvoice.customerWallet as `0x${string}`, refundAmount],
                                  });
                                } else {
                                  // For native KAIA refunds (future implementation)
                                  alert('Native KAIA refunds not yet implemented');
                                  setIsProcessingRefund(false);
                                }
                              } catch (error) {
                                console.error('Refund error:', error);
                                alert('Failed to initiate refund transaction');
                                setIsProcessingRefund(false);
                              }
                            }
                          }}
                          disabled={isProcessingRefund || isRefunding || isRefundConfirming}
                          className={`inline-flex items-center text-xs px-2 py-1 rounded transition-colors ${
                            isProcessingRefund || isRefunding || isRefundConfirming
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {isProcessingRefund || isRefunding || isRefundConfirming ? 'Processing...' : 'Refund'}
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedInvoice.refundTransferHash && (
                    <div>
                      <p className="text-xs text-gray-500">Refund Transaction Hash</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm font-medium text-gray-900 font-mono truncate flex-1">
                          {selectedInvoice.refundTransferHash}
                        </p>
                        <a
                          href={`https://kairos.kaiascan.io/tx/${selectedInvoice.refundTransferHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Explorer
                        </a>
                      </div>
                      {selectedInvoice.refundedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Refunded on {new Date(selectedInvoice.refundedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedInvoice.blockNumber && (
                    <div>
                      <p className="text-xs text-gray-500">Block Number</p>
                      <p className="text-sm font-medium text-gray-900">{selectedInvoice.blockNumber}</p>
                    </div>
                  )}
                  {selectedInvoice.gasUsed && (
                    <div>
                      <p className="text-xs text-gray-500">Gas Used</p>
                      <p className="text-sm font-medium text-gray-900">{selectedInvoice.gasUsed}</p>
                    </div>
                  )}
                  {selectedInvoice.tokenAddress && (
                    <div>
                      <p className="text-xs text-gray-500">Token Contract</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm font-medium text-gray-900 font-mono truncate flex-1">
                          {selectedInvoice.tokenAddress}
                        </p>
                        <a
                          href={`https://kairos.kaiascan.io/address/${selectedInvoice.tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Link Section */}
            <div className="border-t pt-6 mb-6">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment Link</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/pay?orderId=${selectedInvoice.id}`}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50"
                />
                <button
                  onClick={() => copyPaymentLink(selectedInvoice.id)}
                  className={`px-3 py-2 rounded transition-colors ${
                    copiedId === selectedInvoice.id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {copiedId === selectedInvoice.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <Link
                  href={`/pay?orderId=${selectedInvoice.id}`}
                  target="_blank"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Payment Page
                </Link>
                <button
                  onClick={() => {
                    copyPaymentLink(selectedInvoice.id);
                  }}
                  className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                    copiedId === selectedInvoice.id
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedId === selectedInvoice.id ? 'Link Copied!' : 'Copy Payment Link'}
                </button>
                {selectedInvoice.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      // Placeholder for cancel invoice functionality
                      alert('Cancel invoice functionality to be implemented');
                    }}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                  >
                    Cancel Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}