import logo from "@/assets/logo-vtr.png";
import mark from "@/assets/logo-mark.png";

export function Logo({ className = "h-9" }: { className?: string }) {
  return <img src={logo} alt="VTR Gestão IA" className={className} />;
}

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return <img src={mark} alt="VTR" className={className} />;
}
