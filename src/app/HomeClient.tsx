"use client";

import dynamic from "next/dynamic";
import React from "react";

type Props = {
  titleFontClassName: string;
  monoFontClassName: string;
};

const Landing = dynamic(() => import("@/components/home/ChloeverseMainLanding"), {
  ssr: false,
  loading: () => null,
});

export default function HomeClient(props: Props) {
  return <Landing {...props} />;
}
