import { motion } from "framer-motion";
import { ShieldCheck, Scale, FileText, HardHat, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const services = [
  {
    id: "ambiental",
    icon: ShieldCheck,
    title: "Ambiental, Licenças e Regularizações",
    description: "Navegamos pela burocracia para que você foque no seu negócio. Gerenciamos todo o ciclo de vida das licenças ambientais e sanitárias.",
    items: [
      "Licença Prévia (LP), Instalação (LI) e Operação (LO)",
      "Regularização junto à CETESB e órgãos municipais",
      "Alvará de Vigilância Sanitária e Funcionamento",
      "AVCB (Auto de Vistoria do Corpo de Bombeiros)",
      "Gestão de condicionantes ambientais",
      "Auditoria de conformidade legal"
    ]
  },
  {
    id: "regulacao",
    icon: Scale,
    title: "Regulação e Fiscalizações",
    description: "Defesa técnica robusta e acompanhamento proativo junto aos principais órgãos fiscalizadores do país.",
    items: [
      "Representação junto à ANP (Agência Nacional do Petróleo)",
      "Processos regulatórios na ANVISA",
      "Defesas administrativas no PROCON e IPEM",
      "Gestão de crises em fiscalizações",
      "Acompanhamento de TACs (Termos de Ajustamento de Conduta)",
      "Consultoria para novos marcos regulatórios"
    ]
  },
  {
    id: "trabalhista",
    icon: FileText,
    title: "Trabalhista Preventivo",
    description: "Transformamos o passivo trabalhista em ativo de gestão através de práticas preventivas e educação corporativa.",
    items: [
      "Consultoria preventiva para RH e Gestores",
      "Auditoria de procedimentos trabalhistas",
      "Implementação de políticas internas",
      "Treinamentos in-company sobre legislação",
      "Análise de contratos de trabalho e terceirização",
      "Gestão estratégica de afastamentos"
    ]
  },
  {
    id: "nr1",
    icon: HardHat,
    title: "NR-1 e Riscos Psicossociais",
    description: "Adequação completa às normas de segurança com um olhar moderno para a saúde mental e governança corporativa.",
    items: [
      "Gerenciamento de Riscos Ocupacionais (PGR)",
      "Levantamento de Perigos e Riscos",
      "Avaliação de riscos psicossociais no trabalho",
      "Implementação de Canal de Denúncias (Lei 14.457/22)",
      "Programas de Saúde Mental Corporativa",
      "Compliance em Segurança do Trabalho"
    ]
  }
];

export default function Services() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">Nossas Soluções</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Atuamos nos pilares fundamentais da conformidade corporativa, oferecendo segurança técnica e jurídica para sua operação.
            </p>
          </motion.div>
        </div>

        <div className="space-y-24">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}
            >
              {/* Visual Side */}
              <div className="w-full lg:w-1/2">
                <div className="relative">
                  <div className={`absolute top-0 ${index % 2 === 0 ? '-left-4' : '-right-4'} w-24 h-24 bg-accent/10 rounded-full blur-2xl`} />
                  <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl relative z-10">
                    <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-6">
                      <service.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-4">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <Link href="/contact">
                      <Button variant="outline" className="w-full sm:w-auto">Solicitar Proposta</Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Content Side */}
              <div className="w-full lg:w-1/2">
                <h3 className="text-2xl font-bold text-primary mb-6 hidden lg:block">{service.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-700" />
                      </div>
                      <span className="text-gray-700 text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
