import { Link } from "wouter";
import { Shield, Mail, Phone, MapPin, Linkedin, Facebook, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 cursor-pointer">
              <div className="bg-white text-primary p-2 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tighter">PRISMA</span>
            </Link>
            <p className="text-gray-400 leading-relaxed text-sm">
              Suporte técnico e jurídico-operacional especializado para operações reguladas e ambientes corporativos complexos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Links Rápidos</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-accent transition-colors">Sobre a PRISMA</Link></li>
              <li><Link href="/services" className="hover:text-accent transition-colors">Serviços</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors">Fale Conosco</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6">Contato</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-accent" />
                <a href="mailto:contato@prisma.com.br" className="hover:text-white">contato@prisma.com.br</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-accent" />
                <a href="tel:+5543996063751" className="hover:text-white">+55 43 99606-3751</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-accent mt-1" />
                <span>Atuamos em SP, PR, MG e DF</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-bold mb-6">Siga-nos</h4>
            <div className="flex gap-4">
              <a href="#" className="bg-white/10 hover:bg-accent p-2 rounded-full transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-accent p-2 rounded-full transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-accent p-2 rounded-full transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} PRISMA. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
