import type { Metadata } from "next";
import { SocialMeta } from "@/components/social-meta";
import { KubernetesCommons } from "@/features/tools/kubernetes/kubernetes";

const description =
  "A playful, walkable Kubernetes refresher. Explore Pods, controllers, EKS Auto Mode, Karpenter, Istio, and operators in a tiny tea-serving campus.";
export const metadata: Metadata = {
  title: "The cluster commons · Kubernetes",
  description,
  alternates: { canonical: "/tools/kubernetes" },
};
export default function KubernetesPage() {
  return (
    <>
      <SocialMeta
        title="The cluster commons · Kubernetes"
        description={description}
        url="/tools/kubernetes"
        image="/tool-previews/kubernetes.dark.png"
      />
      <KubernetesCommons />
    </>
  );
}
