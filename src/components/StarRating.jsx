import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, size = 16, showNumber = true }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={
              i <= fullStars || (i === fullStars + 1 && hasHalf)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }
          />
        ))}
      </div>
      {showNumber && (
        <span className="text-sm text-gray-600 font-medium">
          {rating > 0 ? rating.toFixed(1) : 'New'}
        </span>
      )}
    </div>
  );
}
