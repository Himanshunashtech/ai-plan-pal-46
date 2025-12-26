// import { useRef, useState, useEffect } from 'react';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

// interface SwipeableChartProps {
//   children: React.ReactNode;
//   dataLength: number;
//   itemWidth?: number;
// }

// const SwipeableChart = ({ children, dataLength, itemWidth = 40 }: SwipeableChartProps) => {
//   const scrollRef = useRef<HTMLDivElement>(null);
//   const [canScrollLeft, setCanScrollLeft] = useState(false);
//   const [canScrollRight, setCanScrollRight] = useState(false);
//   const [showHint, setShowHint] = useState(true);

//   const checkScroll = () => {
//     if (scrollRef.current) {
//       const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
//       setCanScrollLeft(scrollLeft > 0);
//       setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
//     }
//   };

//   useEffect(() => {
//     checkScroll();
//     // Scroll to the end (most recent data) on mount
//     if (scrollRef.current) {
//       scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
//       setTimeout(checkScroll, 100);
//     }
    
//     // Hide hint after 3 seconds
//     const timer = setTimeout(() => setShowHint(false), 3000);
//     return () => clearTimeout(timer);
//   }, [dataLength]);

//   const scroll = (direction: 'left' | 'right') => {
//     if (scrollRef.current) {
//       const scrollAmount = scrollRef.current.clientWidth * 0.8;
//       scrollRef.current.scrollBy({
//         left: direction === 'left' ? -scrollAmount : scrollAmount,
//         behavior: 'smooth'
//       });
//     }
//   };

//   // Calculate minimum width based on data length
//   const minWidth = Math.max(dataLength * itemWidth, 100);

//   return (
//     <div className="relative">
//       {/* Scroll hint overlay */}
//       {showHint && canScrollLeft && (
//         <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
//           <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground animate-fade-in flex items-center gap-1">
//             <ChevronLeft className="w-3 h-3" />
//             Swipe to see history
//             <ChevronRight className="w-3 h-3" />
//           </div>
//         </div>
//       )}

//       {/* Left scroll button */}
//       {canScrollLeft && (
//         <button
//           onClick={() => scroll('left')}
//           className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
//         >
//           <ChevronLeft className="w-4 h-4" />
//         </button>
//       )}

//       {/* Right scroll button */}
//       {canScrollRight && (
//         <button
//           onClick={() => scroll('right')}
//           className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
//         >
//           <ChevronRight className="w-4 h-4" />
//         </button>
//       )}

//       {/* Gradient overlays for scroll indication */}
//       {canScrollLeft && (
//         <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
//       )}
//       {canScrollRight && (
//         <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
//       )}

//       {/* Scrollable container */}
//       <div
//         ref={scrollRef}
//         onScroll={checkScroll}
//         className="overflow-x-auto scrollbar-hide touch-pan-x"
//         style={{ WebkitOverflowScrolling: 'touch' }}
//       >
//         <div style={{ minWidth: `${minWidth}%`, width: 'max-content' }}>
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SwipeableChart;


import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SwipeableChartProps {
  children: React.ReactNode
  dataLength: number
  itemWidth?: number
}

const SwipeableChart = ({
  children,
  dataLength,
  itemWidth = 40,
}: SwipeableChartProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [showHint, setShowHint] = useState(true)

  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontal = useRef(false)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()

    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
      setTimeout(checkScroll, 100)
    }

    const timer = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(timer)
  }, [dataLength])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  const minWidth = Math.max(dataLength * itemWidth, 100)

  return (
    <div className="relative">
      {/* Hint */}
      {showHint && canScrollLeft && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" />
            Swipe to see history
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/90 backdrop-blur shadow flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/90 backdrop-blur shadow flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX
          startY.current = e.touches[0].clientY
          isHorizontal.current = false
        }}
        onTouchMove={(e) => {
          const dx = Math.abs(e.touches[0].clientX - startX.current)
          const dy = Math.abs(e.touches[0].clientY - startY.current)

          // Only lock when horizontal intent is clear
          if (dx > dy && dx > 10) {
            isHorizontal.current = true
          }

          if (isHorizontal.current) {
            e.preventDefault()
          }
        }}
        className="overflow-x-auto scrollbar-hide"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y', // ✅ allows vertical page scroll
        }}
      >
        <div style={{ minWidth: `${minWidth}px`, width: 'max-content' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default SwipeableChart

