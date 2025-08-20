import Link from "next/link";
import { ArrowRight, ShoppingCart, Zap, Shield, Code, Globe, DollarSign, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Kaia Commerce</span>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">BETA</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/pay" className="text-gray-600 hover:text-gray-900 transition-colors">
              Demo
            </Link>
            <a href="https://github.com/nickmura/kaia-commerce" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
              GitHub
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            <span>Proof of Concept</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Accept KRW Stablecoin
            <br />
            <span className="text-blue-600">in Your Shopify Store</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A research project exploring seamless cryptocurrency payments for e-commerce using 
            Kaia blockchain's KRW stablecoin.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              href="/pay?amount=99&merchant=Demo+Store&product=Sample+Product&currency=KRW"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Try Demo Payment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="https://github.com/nickmura/kaia-commerce"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Code className="w-5 h-5" />
              <span>View Source Code</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Research Focus Areas</h2>
            <p className="text-gray-600">Exploring the future of e-commerce payments on blockchain</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Kaia Network</h3>
              <p className="text-gray-600">
                Built on Kaia blockchain (formerly Klaytn), leveraging its fast finality and low gas fees
                for optimal payment processing.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">KRW Stablecoin</h3>
              <p className="text-gray-600">
                Utilizing Korean Won pegged stablecoin for stable pricing and familiar currency
                denomination in Korean markets.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Contracts</h3>
              <p className="text-gray-600">
                ERC-20 token standard implementation with approve/transfer pattern for secure
                and transparent transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Implementation */}
      <section className="container mx-auto px-6 py-20 bg-gray-50 rounded-3xl my-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Technical Implementation</h2>
            <p className="text-gray-600">Open-source proof of concept for Web3 commerce</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Shopify Webhook Integration</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Automated order processing and status synchronization
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">RainbowKit Wallet Connection</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Support for MetaMask, Kaia Wallet, and WalletConnect
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Real-time Transaction Tracking</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    On-chain verification with Kaiascan explorer integration
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">PostgreSQL Order Management</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Prisma ORM for reliable order and payment tracking
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Tech Stack:</strong> Next.js 15, TypeScript, Wagmi, Viem, Prisma, PostgreSQL, TailwindCSS
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Explore Web3 Commerce?
          </h2>
          <p className="text-gray-600 mb-8">
            This is an experimental project for research and educational purposes.
            <br />
            Test with Kairos testnet tokens only.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              href="/pay"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <span>Launch Payment Gateway</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="https://kairos.kaiascan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <span>View on Kaiascan</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-200">
        <div className="text-center text-gray-600 text-sm">
          <p className="mb-2">
            Kaia Commerce - A proof of concept for blockchain payments in e-commerce
          </p>
          <p>
            Built with ❤️ for the Kaia ecosystem | 
            <a href="https://github.com/nickmura/kaia-commerce" className="text-blue-600 hover:text-blue-700 ml-1">
              Open Source
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}