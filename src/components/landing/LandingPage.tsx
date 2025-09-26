import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  FileText, 
  Shield, 
  Phone, 
  Mail, 
  Smartphone, 
  Users, 
  Building, 
  Clock, 
  CheckCircle, 
  Star, 
  ArrowRight, 
  Menu, 
  X,
  Zap,
  Globe,
  Headphones,
  PenTool,
  Database,
  Settings,
  Award,
  Lock,
  Wifi,
  PhoneCall
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'features', 'pricing'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const features = [
    {
      icon: FileText,
      title: 'Gestão de Protocolos',
      description: 'Sistema completo para criação, acompanhamento e gestão de protocolos com numeração automática e controle de status.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: MessageCircle,
      title: 'Chat em Tempo Real',
      description: 'Comunicação instantânea entre agentes e clientes com notificações em tempo real e histórico completo.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Shield,
      title: 'Assinatura Digital',
      description: 'Assinatura digital integrada com sistema próprio (MP 2.200-2/2001) e certificados ICP-Brasil para validade jurídica.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Phone,
      title: 'Central Telefônica',
      description: 'URA personalizada, filas de atendimento, telefones IP e integração automática com dados de clientes e protocolos.',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      icon: Mail,
      title: 'Email Integrado',
      description: 'Sistema de email com domínio personalizado, templates automáticos e rastreamento de entrega e leitura.',
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: Smartphone,
      title: 'WhatsApp Business',
      description: 'Integração completa com WhatsApp Business para atendimento multicanal e automação de respostas.',
      color: 'bg-green-100 text-green-600'
    }
  ];

  const integrations = [
    {
      icon: PhoneCall,
      title: 'Telefonia IP',
      description: 'Aparelhos IP, softphones e integração com aplicativos móveis'
    },
    {
      icon: Headphones,
      title: 'URA Inteligente',
      description: 'Central de atendimento com menu personalizado e roteamento automático'
    },
    {
      icon: Database,
      title: 'Portabilidade',
      description: 'Mantenha seu número atual com portabilidade completa'
    },
    {
      icon: Wifi,
      title: 'Multi-dispositivo',
      description: 'Acesse de qualquer lugar: web, mobile, telefone IP ou aplicativo'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'R$ 99',
      period: '/mês',
      description: 'Ideal para pequenas empresas',
      features: [
        'Até 1.000 protocolos/mês',
        '5 usuários inclusos',
        'Chat em tempo real',
        'Email integrado',
        'Suporte por email'
      ],
      highlighted: false
    },
    {
      name: 'Professional',
      price: 'R$ 299',
      period: '/mês',
      description: 'Para empresas em crescimento',
      features: [
        'Até 5.000 protocolos/mês',
        '20 usuários inclusos',
        'WhatsApp integrado',
        'Telefonia básica (1 linha)',
        'Assinatura digital',
        'Relatórios avançados',
        'Suporte prioritário'
      ],
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Sob consulta',
      period: '',
      description: 'Solução completa para grandes empresas',
      features: [
        'Protocolos ilimitados',
        'Usuários ilimitados',
        'Central telefônica completa',
        'URA personalizada',
        'Certificado ICP-Brasil',
        'Integrações customizadas',
        'Suporte 24/7',
        'Gerente de conta dedicado'
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#f79000] to-[#ff8c42] rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ProtocolHub</h1>
                <p className="text-xs text-gray-500">Gestão Inteligente</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'home' ? 'text-[#f79000]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Início
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'about' ? 'text-[#f79000]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sobre Nós
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'features' ? 'text-[#f79000]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'pricing' ? 'text-[#f79000]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Preços
              </button>
            </nav>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Entrar
              </Link>
              <button className="bg-[#f79000] hover:bg-[#e68200] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg hover:shadow-xl">
                Cadastrar-se
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-1">
              <button
                onClick={() => scrollToSection('home')}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
              >
                Início
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
              >
                Sobre Nós
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
              >
                Preços
              </button>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <Link
                  to="/login"
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                >
                  Entrar
                </Link>
                <button className="w-full mt-2 bg-[#f79000] hover:bg-[#e68200] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Cadastrar-se
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-[#f79000]/10 text-[#f79000] px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                <span>Solução Completa de Gestão</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Gestão de
                <span className="text-[#f79000] block">Protocolos</span>
                <span className="text-gray-600 text-3xl lg:text-4xl block mt-2">Inteligente</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Plataforma completa para gestão de documentos e atendimentos com 
                <strong className="text-[#f79000]"> assinatura digital</strong>, 
                <strong className="text-[#f79000]"> telefonia integrada</strong> e 
                <strong className="text-[#f79000]"> comunicação multicanal</strong>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-[#f79000] hover:bg-[#e68200] text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Começar Gratuitamente
                </button>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="border-2 border-[#f79000] text-[#f79000] hover:bg-[#f79000] hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all"
                >
                  Ver Funcionalidades
                </button>
              </div>
              
              <div className="flex items-center space-x-6 mt-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Sem taxa de setup</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Suporte 24/7</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Teste grátis 30 dias</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-[#f79000] to-[#ff8c42] rounded-2xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-xl p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#f79000] rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Protocolo #20250106.00000123</p>
                      <p className="text-sm text-gray-500">Solicitação de Suporte</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Em Andamento
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Assinatura:</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        Pendente
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Cliente online</span>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 animate-bounce">
                <Shield className="w-6 h-6 text-[#f79000]" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 animate-pulse">
                <Phone className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Sobre o <span className="text-[#f79000]">ProtocolHub</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desenvolvemos a plataforma mais completa do mercado para gestão de protocolos, 
              combinando tecnologia de ponta com facilidade de uso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f79000]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-[#f79000]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Inovação</h3>
              <p className="text-gray-600">
                Tecnologia de ponta com assinatura digital própria e integrações avançadas.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f79000]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#f79000]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Segurança</h3>
              <p className="text-gray-600">
                Conformidade com LGPD e certificações de segurança para proteger seus dados.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f79000]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#f79000]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Suporte</h3>
              <p className="text-gray-600">
                Equipe especializada disponível 24/7 para garantir o sucesso da sua operação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades <span className="text-[#f79000]">Completas</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tudo que você precisa para gerenciar protocolos, documentos e atendimentos 
              em uma única plataforma integrada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                >
                  <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Integrations Highlight */}
          <div className="bg-gradient-to-r from-[#f79000] to-[#ff8c42] rounded-2xl p-8 text-white">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4">Integrações Telefônicas</h3>
              <p className="text-xl opacity-90">
                Central telefônica completa com URA personalizada e múltiplos canais de atendimento
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {integrations.map((integration, index) => {
                const Icon = integration.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">{integration.title}</h4>
                    <p className="text-sm opacity-90">{integration.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Legal Compliance Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Assinatura Digital com Validade Jurídica</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Nosso sistema de assinatura digital está em conformidade com a legislação brasileira
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <PenTool className="w-6 h-6 text-[#f79000]" />
                  <h4 className="text-lg font-semibold text-gray-900">Sistema Próprio</h4>
                </div>
                <p className="text-gray-600 mb-4">
                  Assinatura digital integrada baseada na <strong>MP 2.200-2/2001</strong> 
                  que estabelece a validade jurídica de documentos eletrônicos.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Validade jurídica garantida</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Processo simplificado</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Integração nativa</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <Award className="w-6 h-6 text-blue-600" />
                  <h4 className="text-lg font-semibold text-gray-900">ICP-Brasil</h4>
                </div>
                <p className="text-gray-600 mb-4">
                  Suporte completo para certificados digitais ICP-Brasil, 
                  oferecendo o mais alto nível de segurança e autenticidade.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Certificação A1 e A3</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Máxima segurança</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Padrão governamental</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planos que <span className="text-[#f79000]">Crescem</span> com Você
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Escolha o plano ideal para sua empresa. Todos incluem suporte técnico e atualizações gratuitas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                  plan.highlighted 
                    ? 'ring-2 ring-[#f79000] scale-105' 
                    : 'border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-[#f79000] text-white text-center py-2 rounded-t-2xl">
                    <span className="text-sm font-semibold">Mais Popular</span>
                  </div>
                )}
                
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500 ml-1">{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                      plan.highlighted
                        ? 'bg-[#f79000] hover:bg-[#e68200] text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {plan.price === 'Sob consulta' ? 'Falar com Vendas' : 'Começar Agora'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Precisa de mais usuários ou funcionalidades específicas?
            </p>
            <button className="text-[#f79000] hover:text-[#e68200] font-semibold flex items-center space-x-2 mx-auto">
              <span>Fale com nosso time de vendas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#f79000] to-[#ff8c42]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para Revolucionar sua Gestão?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Junte-se a centenas de empresas que já transformaram seus processos com o ProtocolHub
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#f79000] hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
              Teste Grátis por 30 Dias
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-[#f79000] px-8 py-4 rounded-xl text-lg font-semibold transition-all">
              Agendar Demonstração
            </button>
          </div>
          
          <div className="flex items-center justify-center space-x-8 mt-8 text-white/80">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Sem compromisso</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Setup gratuito</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Suporte incluído</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#f79000] to-[#ff8c42] rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">ProtocolHub</h3>
                  <p className="text-sm text-gray-400">Gestão Inteligente</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                A plataforma mais completa para gestão de protocolos, documentos e atendimentos 
                com assinatura digital e telefonia integrada.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Mail className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Globe className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white transition-colors">Funcionalidades</button></li>
                <li><button className="hover:text-white transition-colors">Integrações</button></li>
                <li><button className="hover:text-white transition-colors">Segurança</button></li>
                <li><button className="hover:text-white transition-colors">API</button></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white transition-colors">Central de Ajuda</button></li>
                <li><button className="hover:text-white transition-colors">Documentação</button></li>
                <li><button className="hover:text-white transition-colors">Contato</button></li>
                <li><button className="hover:text-white transition-colors">Status do Sistema</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 ProtocolHub. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button className="text-gray-400 hover:text-white text-sm transition-colors">
                Política de Privacidade
              </button>
              <button className="text-gray-400 hover:text-white text-sm transition-colors">
                Termos de Uso
              </button>
              <button className="text-gray-400 hover:text-white text-sm transition-colors">
                LGPD
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
