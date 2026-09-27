// Screenshots and photos, by the key the JSON uses. Astro resizes them and
// writes modern formats at build time.
import portrait from "../assets/portrait.png";
import headshot from "../assets/headshot.png";
import spinExplorer from "../assets/shots/spin-explorer.png";
import spinQuiz from "../assets/shots/spin-quiz.png";
import shard from "../assets/shots/shard.png";
import bench from "../assets/shots/bench.png";
import wiki from "../assets/shots/wiki.png";

export { portrait, headshot };

export const shots = {
  "spin-explorer": spinExplorer,
  "spin-quiz": spinQuiz,
  shard,
  bench,
  wiki,
};

export function shot(key: string) {
  const img = shots[key as keyof typeof shots];
  if (!img) throw new Error(`No image "${key}" in src/lib/images.ts`);
  return img;
}
