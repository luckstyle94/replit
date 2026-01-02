import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  details: string[];
  delay?: number;
}

export function ServiceCard({ icon: Icon, title, description, details, delay = 0 }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 border-t-4 border-t-transparent hover:border-t-accent group">
        <CardHeader>
          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
          </div>
          <CardTitle className="text-xl mb-2">{title}</CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {description}
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {details.map((detail, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                {detail}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
