import { WindowControls } from "@/components/WindowControls";
import { motion } from "framer-motion";

interface HeaderProps {
  sidebarWidth?: number;
}

export function Header({ sidebarWidth = 256 }: HeaderProps) {
  return (
    <motion.header
      className="fixed top-0 right-0 h-12 z-40 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-end px-4 [-webkit-app-region:drag]"
      initial={false}
      animate={{ left: sidebarWidth }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
    >
      <div className="[-webkit-app-region:no-drag]">
        <WindowControls />
      </div>
    </motion.header>
  );
}
