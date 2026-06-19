"use client";
// next/dynamic does not forward React refs to the loaded component, so a
// `ref` placed on a dynamically-imported react-globe.gl never resolves and its
// imperative API (pointOfView, controls) is unreachable. This thin wrapper
// receives the ref as an ordinary prop and attaches it to the real Globe.
import Globe, { type GlobeMethods } from "react-globe.gl";
import type { MutableRefObject } from "react";

type GlobeWrapperProps = React.ComponentProps<typeof Globe> & {
  globeRef?: MutableRefObject<GlobeMethods | undefined>;
};

export default function GlobeWrapper({ globeRef, ...props }: GlobeWrapperProps) {
  return <Globe ref={globeRef} {...props} />;
}
