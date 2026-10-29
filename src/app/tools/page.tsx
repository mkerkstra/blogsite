import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SocialMeta } from "@/components/social-meta";
import { SectionLabel } from "@/features/resume/components/section-label";

const description = "Interactive tools for explaining systems and exploring ideas together.";
export const metadata: Metadata = {
  title: "Tools",
  description,
  alternates: { canonical: "/tools" },
};
export default function ToolsPage() {
  return (
    <div>
      <SocialMeta title="Tools · kerkstra.dev" description={description} url="/tools" />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tools" }]} />
      <h1 className="mt-3 font-display text-4xl italic">tools</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Working models for thinking out loud. Bring a curious teammate.
      </p>
      <div className="mt-12">
        <SectionLabel index="01">Learn by exploring</SectionLabel>
        <Link href="/tools/kubernetes" className="group mt-6 block no-underline">
          <div className="relative aspect-[1200/630] overflow-hidden border border-border group-hover:border-accent">
            <Image
              src="/tool-previews/kubernetes.dark.png"
              alt="A 3D Kubernetes campus with Pod kiosks, a control plane, and a capacity crane"
              fill
              sizes="(max-width: 768px) 100vw, 704px"
              priority
              className="theme-only-dark object-cover"
            />
            <Image
              src="/tool-previews/kubernetes.light.png"
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 704px"
              className="theme-only-light object-cover"
            />
          </div>
          <h2 className="mt-4 text-lg group-hover:text-accent">The cluster commons</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A first-person field trip through Kubernetes. Serve tea, lose a Pod, grow a cluster, and
            see how application and platform teams work in concert.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Kubernetes · EKS Auto Mode · Karpenter · Istio · Operators
          </p>
        </Link>
      </div>
    </div>
  );
}
