'use client';

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ShoppingCart, Zap, Shield, Code, Globe, DollarSign, CheckCircle, Languages, Store } from "lucide-react";

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'ko'>('en');

  const content = {
    en: {
      nav: { demo: 'Demo', dashboard: 'Dashboard', faucet: 'Faucet', github: 'GitHub' },
      hero: {
        badge: 'Proof of Concept',
        title1: 'Accept KRW Stablecoin',
        title2: 'in Your Shopify Store',
        description: 'A research project exploring seamless cryptocurrency payments for e-commerce using Kaia blockchain\'s KRW stablecoin.',
        tryDemo: 'Try Demo',
        viewSource: 'View Source Code',
        visitStore: 'Visit Shopify Store'
      },
      features: {
        title: 'Research Focus Areas',
        subtitle: 'Exploring the future of e-commerce payments on blockchain',
        kaia: {
          title: 'Kaia Network',
          description: 'Built on Kaia blockchain (formerly Klaytn), leveraging its fast finality and low gas fees for optimal payment processing.'
        },
        krw: {
          title: 'KRW Stablecoin',
          description: 'Utilizing Korean Won pegged stablecoin for stable pricing and familiar currency denomination in Korean markets.'
        },
        smart: {
          title: 'Smart Contracts',
          description: 'ERC-20 token standard implementation with approve/transfer pattern for secure and transparent transactions.'
        }
      },
      tech: {
        title: 'Technical Implementation',
        subtitle: 'Open-source proof of concept for Web3 commerce',
        shopify: {
          title: 'Shopify Webhook Integration',
          description: 'Automated order processing and status synchronization'
        },
        rainbow: {
          title: 'RainbowKit Wallet Connection',
          description: 'Support for MetaMask, Kaia Wallet, and WalletConnect'
        },
        tracking: {
          title: 'Real-time Transaction Tracking',
          description: 'On-chain verification with Kaiascan explorer integration'
        },
        database: {
          title: 'PostgreSQL Order Management',
          description: 'Prisma ORM for reliable order and payment tracking'
        },
        stack: 'Tech Stack:'
      },
      cta: {
        title: 'Ready to Explore Web3 Commerce?',
        description1: 'This is an experimental project for research and educational purposes.',
        description2: 'Test with Kairos testnet tokens only.',
        launch: 'Launch Payment Gateway',
        viewExplorer: 'View on Kaiascan'
      },
      footer: {
        tagline: 'WonWay - A proof of concept for blockchain payments in e-commerce',
        built: 'Built with ❤️ for the Kaia ecosystem',
        opensource: 'Open Source'
      }
    },
    ko: {
      nav: { demo: '데모', dashboard: '대시보드', faucet: '수도꼭지', github: '깃허브' },
      hero: {
        badge: '개념 증명',
        title1: 'KRW 스테이블코인',
        title2: 'Shopify 결제 지원',
        description: 'Kaia 블록체인의 KRW 스테이블코인을 활용한 전자상거래 암호화폐 결제 연구 프로젝트',
        tryDemo: '데모 체험',
        viewSource: '소스 코드 보기',
        visitStore: 'Shopify 스토어 방문'
      },
      features: {
        title: '연구 중점 분야',
        subtitle: '블록체인 기반 전자상거래 결제의 미래 탐구',
        kaia: {
          title: 'Kaia 네트워크',
          description: 'Kaia 블록체인(구 Klaytn)을 기반으로 빠른 완결성과 낮은 가스비를 활용한 최적의 결제 처리'
        },
        krw: {
          title: 'KRW 스테이블코인',
          description: '한국 시장에 친숙한 원화 페깅 스테이블코인을 활용한 안정적인 가격 책정'
        },
        smart: {
          title: '스마트 컨트랙트',
          description: '안전하고 투명한 거래를 위한 ERC-20 토큰 표준 구현 및 승인/전송 패턴'
        }
      },
      tech: {
        title: '기술 구현',
        subtitle: 'Web3 커머스를 위한 오픈소스 개념 증명',
        shopify: {
          title: 'Shopify 웹훅 통합',
          description: '자동화된 주문 처리 및 상태 동기화'
        },
        rainbow: {
          title: 'RainbowKit 지갑 연결',
          description: 'MetaMask, Kaia Wallet, WalletConnect 지원'
        },
        tracking: {
          title: '실시간 거래 추적',
          description: 'Kaiascan 탐색기 통합을 통한 온체인 검증'
        },
        database: {
          title: 'PostgreSQL 주문 관리',
          description: '안정적인 주문 및 결제 추적을 위한 Prisma ORM'
        },
        stack: '기술 스택:'
      },
      cta: {
        title: 'Web3 커머스를 탐험할 준비가 되셨나요?',
        description1: '이것은 연구 및 교육 목적의 실험 프로젝트입니다.',
        description2: 'Kairos 테스트넷 토큰으로만 테스트하세요.',
        launch: '결제 게이트웨이 실행',
        viewExplorer: 'Kaiascan에서 보기'
      },
      footer: {
        tagline: 'WonWay - 전자상거래 블록체인 결제 개념 증명',
        built: 'Kaia 생태계를 위해 ❤️로 제작',
        opensource: '오픈 소스'
      }
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="text-xl font-bold text-gray-900">WonWay</span>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">BETA</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t.nav.dashboard}
            </Link>
            <Link href="/faucet" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t.nav.faucet}
            </Link>
            <a href="https://github.com/nickmura/wonway" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t.nav.github}
            </a>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg px-3 py-1.5"
            >
              <Languages className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'en' ? 'KO' : 'EN'}</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            <span>{t.hero.badge}</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t.hero.title1}
            <br />
            <span className="text-blue-600">{t.hero.title2}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t.hero.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a 
              href="https://woocommerce.wonway.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              <Store className="w-5 h-5" />
              <span>Try WooCommerce Store</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a 
              href="https://kaia-commerce.myshopify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              <Store className="w-5 h-5" />
              <span>{t.hero.visitStore}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a 
              href="https://github.com/nickmura/kaia-commerce"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Code className="w-5 h-5" />
              <span>{t.hero.viewSource}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.features.title}</h2>
            <p className="text-gray-600">{t.features.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.features.kaia.title}</h3>
              <p className="text-gray-600">
                {t.features.kaia.description}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.features.krw.title}</h3>
              <p className="text-gray-600">
                {t.features.krw.description}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.features.smart.title}</h3>
              <p className="text-gray-600">
                {t.features.smart.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Implementation */}
      <section className="container mx-auto px-6 py-20 bg-gray-50 rounded-3xl my-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.tech.title}</h2>
            <p className="text-gray-600">{t.tech.subtitle}</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">{t.tech.shopify.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {t.tech.shopify.description}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">{t.tech.rainbow.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {t.tech.rainbow.description}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">{t.tech.tracking.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {t.tech.tracking.description}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">{t.tech.database.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {t.tech.database.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>{t.tech.stack}</strong> Next.js 15, TypeScript, Wagmi, Viem, Prisma, PostgreSQL, TailwindCSS
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t.cta.title}
          </h2>
          <p className="text-gray-600 mb-8">
            {t.cta.description1}
            <br />
            {t.cta.description2}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              href={`/pay?lang=${language}`}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <span>{t.cta.launch}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="https://kairos.kaiascan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <span>{t.cta.viewExplorer}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-200">
        <div className="text-center text-gray-600 text-sm">
          <p className="mb-2">
            {t.footer.tagline}
          </p>
          <p>
            {t.footer.built} | 
            <a href="https://github.com/nickmura/kaia-commerce" className="text-blue-600 hover:text-blue-700 ml-1">
              {t.footer.opensource}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}