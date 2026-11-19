import MotionProvider from "@/components/providers";

export default function AboutLayout({ children }: LayoutProps<"/about">) {
  return <MotionProvider>{children}</MotionProvider>;
}
