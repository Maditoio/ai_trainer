"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReferralLinkCopy({ referralLink }: { referralLink: string }) {
  const [copied, setCopied] = useState(false);

  async function copyReferralLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="break-all rounded-xl bg-white p-3 font-mono text-xs text-slate-700">
        {referralLink}
      </p>
      <Button
        type="button"
        variant="outline"
        className="w-full border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50"
        onClick={copyReferralLink}
      >
        <Copy className="mr-2 h-4 w-4" />
        {copied ? "Copied" : "Copy referral link"}
      </Button>
    </div>
  );
}
