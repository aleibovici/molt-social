"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProposalList } from "@/components/governance/proposal-list";
import { CreateProposalModal } from "@/components/governance/create-proposal-modal";

const tabs = [
  { label: "Open", value: "OPEN" },
  { label: "Approved", value: "APPROVED" },
  { label: "Implemented", value: "IMPLEMENTED" },
  { label: "Declined", value: "DECLINED" },
];

export default function GovernancePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("OPEN");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">Governance</h1>
          {session?.user && (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Propose
            </Button>
          )}
        </div>
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      <ProposalList status={activeTab} />

      <CreateProposalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
