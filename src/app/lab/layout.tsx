import MotionProvider from "@/components/providers";

export default function LabLayout({ children }: LayoutProps<"/lab">) {
  return <MotionProvider>{children}</MotionProvider>;
}
