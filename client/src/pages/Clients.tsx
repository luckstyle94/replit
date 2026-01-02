import { motion } from "framer-motion";
import { Building2, Store, Factory, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const clientTypes = [
  {
    icon: Factory,
    title: "Indústrias",
    description: "Operações complexas que necessitam de licenciamento ambiental rigoroso, gestão de resíduos e adequação contínua às normas de segurança do trabalho (NRs)."
  },
  {
    icon: Store,
    title: "Varejo e Comércio",
    description: "Empresas com múltiplos pontos de venda que precisam de padronização em alvarás, licenças sanitárias e defesas no PROCON."
  },
  {
    icon: Building2,
    title: "Prestadores de Serviços",
    description: "Companhias que buscam mitigar riscos trabalhistas e garantir a conformidade contratual em suas operações."
  },
  {
    icon: Briefcase,
    title: "Corporativo",
    description: "Empresas focadas em governança, ESG e saúde mental corporativa, buscando adequação à Lei 14.457/22 e canais de denúncia."
  }
];

export default function Clients() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">Para Quem Trabalhamos</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Atendemos empresas que não podem se dar ao luxo de parar por questões burocráticas.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {clientTypes.map((client, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <client.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">{client.title}</h3>
              <p className="text-gray-600 leading-relaxed">{client.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Region Section */}
        <div className="bg-primary text-white rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-8">Abrangência Nacional</h2>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10">
              {['São Paulo', 'Paraná', 'Minas Gerais', 'Distrito Federal'].map((state) => (
                <div key={state} className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 font-semibold">
                  {state}
                </div>
              ))}
            </div>
            <p className="max-w-2xl mx-auto text-gray-300 mb-8">
              Nossa estrutura permite atendimento ágil e presencial nos principais polos econômicos do país.
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold">
                Consulte disponibilidade na sua região
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
