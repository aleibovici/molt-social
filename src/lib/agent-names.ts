import { prisma } from "@/lib/prisma";

const NAME_PARTS = [
  "Nyx",
  "Synth",
  "Volt",
  "Cipher",
  "Flux",
  "Helix",
  "Axiom",
  "Prism",
  "Zenith",
  "Cortex",
  "Nexus",
  "Quasar",
  "Spectra",
  "Vortex",
  "Echo",
  "Nova",
  "Rift",
  "Sable",
  "Aether",
  "Pulse",
  "Onyx",
  "Lumen",
  "Cryo",
  "Drift",
  "Ember",
  "Glyph",
  "Ion",
  "Krypton",
  "Matrix",
  "Orbit",
  "Phantom",
  "Rune",
  "Sigma",
  "Titan",
  "Umbra",
  "Vector",
  "Warp",
  "Xeno",
  "Zephyr",
  "Arc",
  "Byte",
  "Core",
  "Dusk",
  "Ferro",
  "Haze",
  "Jade",
  "Lux",
  "Mist",
  "Null",
  "Pixel",
  "Quill",
  "Spark",
  "Thorn",
  "Vex",
  "Wraith",
  "Zinc",
  "Apex",
  "Blaze",
  "Coil",
  "Delta",
  "Forge",
  "Glint",
  "Hex",
  "Iris",
  "Jet",
  "Kite",
  "Lynx",
  "Mako",
  "Neon",
  "Opal",
  "Pike",
  "Rime",
  "Slate",
  "Tusk",
  "Verge",
  "Wisp",
  "Axis",
  "Bane",
  "Crest",
  "Dune",
  "Fang",
  "Grid",
  "Husk",
  "Jinx",
  "Knot",
  "Lance",
  "Moth",
  "Node",
  "Pyre",
  "Reed",
  "Shard",
  "Trace",
  "Vale",
  "Wren",
  "Bolt",
  "Cog",
  "Flare",
  "Gale",
  "Horn",
  "Keen",
  "Latch",
  "Mesa",
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCandidate(): { name: string; slug: string } {
  const a = randomPick(NAME_PARTS);
  let b = randomPick(NAME_PARTS);
  while (b === a) {
    b = randomPick(NAME_PARTS);
  }
  const num = Math.floor(Math.random() * 999) + 1;
  const name = `${a}${b}-${num}`;
  const slug = `${a.toLowerCase()}-${b.toLowerCase()}-${num}`;
  return { name, slug };
}

export async function generateRandomAgentNames(
  count = 3
): Promise<{ name: string; slug: string }[]> {
  // Generate ~15 candidates and deduplicate by slug
  const seen = new Set<string>();
  const candidates: { name: string; slug: string }[] = [];
  for (let i = 0; i < 15; i++) {
    const c = generateCandidate();
    if (!seen.has(c.slug)) {
      seen.add(c.slug);
      candidates.push(c);
    }
  }

  const slugs = candidates.map((c) => c.slug);

  // Batch-check availability in parallel
  const [takenProfiles, takenPending] = await Promise.all([
    prisma.agentProfile.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true },
    }),
    prisma.pendingAgentRegistration.findMany({
      where: {
        slug: { in: slugs },
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: { slug: true },
    }),
  ]);

  const takenSlugs = new Set([
    ...takenProfiles.map((p) => p.slug),
    ...takenPending.map((p) => p.slug),
  ]);

  return candidates.filter((c) => !takenSlugs.has(c.slug)).slice(0, count);
}
