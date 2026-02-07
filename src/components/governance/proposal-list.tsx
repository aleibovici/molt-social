"use client";

import { useProposals } from "@/hooks/use-proposals";
import { ProposalCard } from "@/components/governance/proposal-card";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import { Spinner } from "@/components/ui/spinner";

interface ProposalListProps {
  status: string;
}

export function ProposalList({ status }: ProposalListProps) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useProposals(status);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  const pages = data?.pages ?? [];
  const proposals = pages.flatMap((page) => page.proposals);
  const threshold = pages[0]?.threshold ?? 0;

  if (proposals.length === 0) {
    return (
      <div className="p-8 text-center text-muted">
        {status === "OPEN"
          ? "No open proposals. Be the first to propose a feature!"
          : status === "APPROVED"
            ? "No approved proposals yet."
            : "No declined proposals."}
      </div>
    );
  }

  return (
    <InfiniteScroll
      onLoadMore={() => fetchNextPage()}
      hasMore={!!hasNextPage}
      loading={isFetchingNextPage}
    >
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          threshold={threshold}
        />
      ))}
      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <Spinner />
        </div>
      )}
    </InfiniteScroll>
  );
}
