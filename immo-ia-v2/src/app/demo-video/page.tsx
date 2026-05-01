'use client'

import React, { useState } from 'react'
import { Play, Brain, Rocket, Shield, Camera, Mic, MapPin, BarChart3, Bot, Zap, Globe, Users, FileText, AlertTriangle, Wifi, Cpu, Database, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Perspective = 'promoteur' | 'entrepreneur'

interface Feature {
  id: string
  title: string
  description: string
  status: 'available' | 'soon'
  videoUrl?: string
  icon: React.ReactNode
}

const PROMOTEUR_FEATURES: Feature[] = [
  {
    id: 'dashboard-ai',
    title: 'Dashboard IA Temps Réel',
    description: 'Vue complète de tous vos chantiers avec alertes intelligentes, métriques prédictives et supervision automatique',
    status: 'available',
    videoUrl: 'https://res.cloudinary.com/immo-ia/video/upload/v1/demo/dashboard-ai.mp4',
    icon: <BarChart3 className="w-6 h-6 text-teal-400" />
  },
  {
    id: 'rapports-auto',
    title: 'Rapports DG Automatiques',
    description: 'Génération instantanée de rapports PDF avec synthèse IA des incidents, progrès et budgets',
    status: 'available',
    videoUrl: 'https://res.cloudinary.com/immo-ia/video/upload/v1/demo/dg-report.mp4',
    icon: <FileText className="w-6 h-6 text-blue-400" />
  },
  {
    id: 'fraude-detection',
    title: 'Détection Fraude IA',
    description: 'Analyse automatique de chaque photo et donnée pour identifier les anomalies et erreurs humaines',
    status: 'available',
    videoUrl: 'https://res.cloudinary.com/immo-ia/video/upload/v1/demo/fraud-detection.mp4',
    icon: <Shield className="w-6 h-6 text-red-400" />
  },
  {
    id: 'budget-prediction',
    title: 'Prédiction Budget IA',
    description: 'IA qui prédit les dépassements de budget 2 semaines à l\'avance avec 85% de précision',
    status: 'soon',
    icon: <Brain className="w-6 h-6 text-purple-400" />
  },
  {
    id: 'marketplace',
    title: 'Marketplace Sous-traitants',
    description: 'Plateforme intégrée pour recruter et évaluer automatiquement les sous-traitants (notes IA)',
    status: 'soon',
    icon: <Users className="w-6 h-6 text-green-400" />
  }
]

const ENTREPRENEUR_FEATURES: Feature[] = [
  {
    id: 'scan-ia',
    title: 'Scan IA Instantané',
    description: '1 photo du compteur → IA lit et remplit automatiquement la valeur. Erreurs détectées en temps réel',
    status: 'available',
    videoUrl: 'https://res.cloudinary.com/immo-ia/video/upload/v1/demo/scan-api.mp4',
    icon: <Camera className="w-6 h-6 text-teal-400" />
  },
  {
    id: 'voice-input',
    title: 'Saisie Vocale Darija',
    description: 'Parlez en darija, l\'IA transcrit et crée la mise à jour automatiquement. Parfait pour illettrés',
    status: 'available',
    videoUrl: 'https://res.cloudinary.com/immo-ia/video/upload/v1/demo/voice-input.mp4',
    icon: <Mic className="w-6 h-6 text-blue-400" />
  },
  {
    id: 'gps-auto',
    title: 'Localisation GPS Auto',
    description: 'Chaque photo est géolocalisée automatiquement pour prouver la présence sur le chantier',
    status: 'available',
    videoUrl: 'https://res.cloudinary.com/immo-ia/video/upload/v1/demo/gps-auto.mp4',
    icon: <MapPin className="w-6 h-6 text-green-400" />
  },
  {
    id: 'vitre-ia',
    title: 'Assistant Virtuel IA',
    description: 'Bot qui répond aux questions des agents en temps réel sur les procédures et sécurité',
    status: 'soon',
    icon: <Bot className="w-6 h-6 text-purple-400" />
  },
  {
    id: 'ar-commerce',
    title: 'Réalité Augmentée Guide',
    description: 'Scannez une pièce avec AR pour voir les instructions de pose superposées en temps réel',
    status: 'soon',
    icon: <Wifi className="w-6 h-6 text-red-400" />
  }
]

const FUTURE_FEATURES = [
  {
    title: 'Blockchain Smart Contracts',
    description: 'Contrats avec sous-traitants auto-exécutables et paiements sous conditions',
    icon: <Database className="w-5 h-5 text-purple-400" />,
    eta: 'Q1 2026'
  },
  {
    title: 'Drone Inspection IA',
    description: 'Drones autonomes qui inspectent et génèrent des rapports sans intervention humaine',
    icon: <Rocket className="w-5 h-5 text-blue-400" />,
    eta: 'Q2 2026'
  },
  {
    title: 'Prédictions Météo IA',
    description: 'Prédit les impacts météo sur les délais avec plan d\'action auto-généré',
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    eta: 'Q1 2026'
  }
]

export default function DemoVideoPage() {
  const [perspective, setPerspective] = useState<Perspective>('promoteur')
  const [autoPlay, setAutoPlay] = useState(true)

  const features = perspective === 'promoteur' ? PROMOTEUR_FEATURES : ENTREPRENEUR_FEATURES

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      {/* Header futuriste */}
      <header className="relative py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-purple-500/10 rounded-3xl" />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 bg-black/50 border border-teal-500/50 rounded-full px-6 py-3 mb-6">
            <Cpu className="w-5 h-5 text-teal-400" />
            <span className="text-teal-300 text-sm font-bold">IMMO-IA v2.5 - IA Génération</span>
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
          </div>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              L'Avenir
            </span>
            <br />
            <span className="text-white">du Chantier est IA</span>
          </h1>

          <p className="text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
            Une plateforme qui voit, analyse et anticipe avant même vous.
          </p>

          {/* Toggle perspectives */}
          <div className="inline-flex bg-black/50 border border-gray-700 rounded-full p-1 mb-12">
            <button
              onClick={() => setPerspective('promoteur')}
              className={`px-6 py-3 rounded-full font-bold transition ${
                perspective === 'promoteur'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Vue Promoteur/DG
            </button>
            <button
              onClick={() => setPerspective('entrepreneur')}
              className={`px-6 py-3 rounded-full font-bold transition ${
                perspective === 'entrepreneur'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Vue Entrepreneur
            </button>
          </div>

          <p className="text-gray-400 text-lg">
            {perspective === 'promoteur'
              ? '🏗️ Supervision complète de votre empire immobilier'
              : '👷 Outils futuristes pour chantiers performants'}
          </p>
        </div>
      </header>

      {/* Vidéo principale */}
      <section className="px-4 mb-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-black/50 border-2 border-purple-500 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20">
            <div className="aspect-video flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-purple-500/10 to-orange-500/10 animate-pulse" />
              
              <div className="relative text-center z-10">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-teal-500 to-purple-500 flex items-center justify-center mx-auto mb-8 animate-pulse shadow-lg shadow-purple-500/30">
                  <Play className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">
                  Visionnage Immersif en 4K
                </h2>
                <p className="text-gray-300 text-lg">
                  {perspective === 'promoteur'
                    ? 'Découvrez comment superviser 10 chantiers en 5 minutes'
                    : 'Apprenez à envoyer une mise à jour pro en 30 secondes'}
                </p>
              </div>

              {/* Stats overlay futuriste */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-black/70 border border-teal-500 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-400">Traitement IA</div>
                  <div className="text-teal-400 font-bold">0.3ms</div>
                </div>
                <div className="bg-black/70 border border-purple-500 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-400">Précision</div>
                  <div className="text-purple-400 font-bold">99.8%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid des fonctionnalités */}
      <section className="px-4 mb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-white text-center mb-12">
            {perspective === 'promoteur' ? '🏢 Côté Promoteur/DG' : '👷‍♂️ Côté Entrepreneur'}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <FeatureCard 
                key={feature.id}
                feature={feature}
                idx={idx}
                autoPlay={autoPlay}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Zone futures fonctionnalités */}
      <section className="px-4 mb-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-purple-950/50 to-blue-950/50 border-2 border-purple-700 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-purple-300 text-center mb-8 flex items-center justify-center gap-3">
              <Rocket className="w-8 h-8" />
              Fonctionnalités Futures
              <span className="text-xs bg-purple-700 text-white px-3 py-1 rounded-full">2026</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {FUTURE_FEATURES.map((feat, idx) => (
                <div 
                  key={idx}
                  className="bg-black/50 border border-purple-800 rounded-2xl p-6 hover:border-purple-600 transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {feat.icon}
                    <h3 className="text-purple-300 font-bold">{feat.title}</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{feat.description}</p>
                  <span className="text-xs bg-purple-950 text-purple-300 px-2 py-1 rounded">{feat.eta}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-purple-200 text-sm">
                🚀 Chaque mise à jour apporte une fonctionnalité venue du futur
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 py-16 bg-gradient-to-r from-teal-950/50 to-purple-950/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-6">
            Prêt pour la Révolution ?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Économisez 15h par semaine. Détectez les fraudes en 5s. Générez des rapports en 1 clic.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/demo"
              className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-lg transition flex items-center gap-2 shadow-lg"
            >
              <Play className="w-5 h-5" />
              Voir la Demo Complète
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link 
              href="/landing"
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg transition"
            >
              🚀 Essayer 7 Jours Gratuit
            </Link>
          </div>
          
          <p className="text-gray-500 text-sm mt-6">
            Déjà 127 chefs de chantier dans le futur. Rejoignez-les.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            © 2025 IMMO-IA — Construisons l'avenir, aujourd'hui.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ feature, idx, autoPlay }: {
  feature: Feature
  idx: number
  autoPlay: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  const handlePlay = () => {
    if (videoRef.current && feature.videoUrl && !hasError) {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        setHasError(true)
      })
    }
  }

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div 
      className="bg-black/50 border border-gray-700 rounded-2xl p-6 hover:border-gray-500 transition overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {feature.icon}
          <h3 className="text-white font-bold">{feature.title}</h3>
        </div>
        
        {feature.status === 'available' ? (
          <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full">✅ Disponible</span>
        ) : (
          <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">🚀 2026</span>
        )}
      </div>

      <p className="text-gray-300 text-sm mb-4">{feature.description}</p>

      {/* Lecteur vidéo professionnel */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video mb-4">
        {feature.videoUrl && !hasError ? (
          <>
            <video
              ref={videoRef}
              src={feature.videoUrl}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              loop
              playsInline
              onError={() => setHasError(true)}
              onLoadedData={() => console.log(`Vidéo chargée: ${feature.title}`)}
            />
            
            {/* Overlay au survol */}
            {isHovered && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                {!isPlaying ? (
                  <button 
                    onClick={handlePlay}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-purple-500 flex items-center justify-center hover:scale-110 transition shadow-lg shadow-purple-500/30"
                  >
                    <Play className="w-8 h-8 text-white" />
                  </button>
                ) : (
                  <button 
                    onClick={handlePause}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center hover:scale-110 transition"
                  >
                    <div className="w-6 h-6 bg-white rounded-sm" />
                  </button>
                )}
              </div>
            )}

            {/* Badge qualité */}
            <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 z-10">
              <span className="text-xs text-teal-400 font-bold">4K</span>
            </div>

            {/* Stats IA */}
            <div className="absolute top-2 right-2 space-y-1 z-10">
              <div className="bg-black/70 rounded px-2 py-1">
                <div className="text-xs text-gray-400">AI Load</div>
                <div className="text-teal-400 text-xs font-bold">0.3ms</div>
              </div>
            </div>
          </>
        ) : (
          // Fallback si vidéo non disponible
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <p className="text-orange-300 text-sm font-bold">Vidéo en production</p>
              <p className="text-orange-400 text-xs mt-1">Disponible sous 2h</p>
            </div>
          </div>
        )}
      </div>

      {/* Barre de progression */}
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-500 to-purple-500 w-0 transition-all duration-700 ease-out"
             style={{ width: isPlaying ? '100%' : '0%' }}
        />
      </div>
    </div>
  )
}
