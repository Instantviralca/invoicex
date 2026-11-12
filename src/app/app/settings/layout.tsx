import { SettingsNav } from "@/components/app/settings-nav";

export default function SettingsLayout({ children }: LayoutProps<"/app/settings">) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <SettingsNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
