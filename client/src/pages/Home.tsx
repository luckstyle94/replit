import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Scale, FileText, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ServiceCard } from "@/components/ServiceCard";
import heroImg from "@/assets/hero-bg.jpg"; // Placeholder for conceptual structure

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center bg-primary overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[70vh] h-[70vh] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-[10%] left-[10%] w-[50vh] h-[50vh] rounded-full bg-accent/10 blur-3xl" />
          
          {/* Use a dark overlay over a professional image if available, otherwise just gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/80" />
          
          {/* Optional: Unsplash background image with low opacity */}
          {/* <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" alt="Corporate Architecture" /> */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-accent/10 border border-accent/20">
              <span className="text-accent font-semibold text-sm tracking-wide uppercase">Atuação Nacional: SP • PR • MG • DF</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Conformidade, Regulação e <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">Gestão de Riscos</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
              Suporte técnico e jurídico-operacional especializado para operações reguladas e ambientes corporativos complexos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/services">
                <Button size="lg" className="text-lg px-8 py-6 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold shadow-lg hover:shadow-accent/25">
                  Conheça Nossos Serviços
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-white/20 text-white hover:bg-white/10 hover:text-white font-semibold backdrop-blur-sm">
                  Fale com um Especialista
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Nossos Pilares de Atuação</h2>
            <p className="text-muted-foreground text-lg">
              Oferecemos uma abordagem integrada para garantir a conformidade e segurança da sua empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard 
              icon={ShieldCheck}
              title="Ambiental e Licenças"
              description="Gestão completa de licenciamento e regularização ambiental para operações complexas."
              details={["Licenças Prévia (LP), Instalação (LI) e Operação (LO)", "CETESB, Prefeitura, Vigilância Sanitária", "Alvará de Funcionamento e AVCB"]}
              delay={0.1}
            />
            <ServiceCard 
              icon={Scale}
              title="Regulação e Fiscalizações"
              description="Defesa estratégica e acompanhamento técnico em processos administrativos e regulatórios."
              details={["Atuação junto à ANP, ANVISA e PROCON", "Defesas administrativas", "Gestão de crises regulatórias"]}
              delay={0.2}
            />
            <ServiceCard 
              icon={FileText}
              title="Trabalhista Preventivo"
              description="Consultoria focada na redução de passivos e segurança jurídica nas relações de trabalho."
              details={["Orientação estratégica a gestores", "Implementação de rotinas preventivas", "Redução de passivos trabalhistas"]}
              delay={0.3}
            />
            <ServiceCard 
              icon={HardHat}
              title="NR-1 e Psicossocial"
              description="Adequação às normas regulamentadoras com foco em saúde e segurança ocupacional."
              details={["Adequação completa à NR-1", "Gestão de riscos psicossociais", "Implementação de canal de denúncias"]}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Value Proposition CTA */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-primary rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
            {/* Background texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Sua empresa protegida e em conformidade.
                </h2>
                <p className="text-lg text-white/80 leading-relaxed">
                  Não deixe riscos regulatórios comprometerem sua operação. A PRISMA oferece a expertise técnica e jurídica que você precisa para crescer com segurança.
                </p>
              </div>
              <Link href="/contact">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-6 rounded-xl font-bold shadow-xl">
                  Agendar Diagnóstico
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
