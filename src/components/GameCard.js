import Link from "next/link";
import Image from "next/image";
import { igdbImageUrl } from "@/lib/igdb";

export default function GameCard({ game }) {
  const coverUrl = igdbImageUrl(game.cover?.image_id, "cover_big");
  const year = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;

  return (
    <Link href={`/games/${game.slug}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/[0.08] group-hover:border-violet-500/50 transition-all duration-200 shadow-md group-hover:shadow-xl group-hover:shadow-violet-900/20">
        {coverUrl ? (
          <>
            <Image
              src={coverUrl}
              alt={game.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
              <p className="text-xs text-white font-medium leading-snug line-clamp-2">{game.name}</p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs text-center px-3 leading-snug">
            {game.name}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-white/80 leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {game.name}
        </p>
        {year && <p className="text-xs text-white/30 mt-0.5">{year}</p>}
      </div>
    </Link>
  );
}
