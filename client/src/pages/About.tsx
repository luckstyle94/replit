import { motion } from "framer-motion";
import { CheckCircle2, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">Sobre a PRISMA</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Somos especialistas em descomplicar o ambiente regulatório brasileiro para empresas que buscam segurança jurídica e operacional.
            </p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Corporate meeting image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80" 
                alt="Equipe PRISMA em reunião estratégica" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-8">
                <div className="text-white">
                  <p className="font-bold text-lg">Excelência Técnica</p>
                  <p className="text-white/80 text-sm">Compromisso com a precisão em cada detalhe.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                <Target className="text-accent w-6 h-6" />
                Nosso Propósito
              </h2>
              <p className="text-gray-600 leading-relaxed">
                A PRISMA nasceu para preencher a lacuna entre as exigências legais e a realidade operacional das empresas. Oferecemos suporte técnico e jurídico-operacional especializado, focado na prevenção de riscos e na conformidade regulatória.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                <Award className="text-accent w-6 h-6" />
                Como Atuamos
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Entendemos que a conformidade é um meio para o sucesso do seu negócio, não um fim em si mesmo. Nossa atuação é pautada na obrigação de meio, utilizando as melhores práticas e conhecimentos técnicos para mitigar riscos, embora não possamos garantir resultados específicos devido à natureza complexa dos órgãos reguladores.
              </p>
              <ul className="space-y-3">
                {[
                  "Foco na prevenção de passivos e multas",
                  "Atuação técnica especializada em órgãos reguladores",
                  "Visão integrada: jurídico, operacional e técnico",
                  "Transparência e ética em todas as etapas"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gray-50 rounded-3xl p-12 border border-gray-100">
          <h3 className="text-2xl font-bold text-primary mb-4">Pronto para elevar o nível de conformidade da sua empresa?</h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Converse com nossos especialistas e descubra como podemos ajudar sua organização a navegar com segurança pelo ambiente regulatório.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-primary hover:bg-primary/90">Fale Conosco</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
