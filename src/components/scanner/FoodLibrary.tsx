import { useState, useEffect } from 'react';
import { Search, Plus, Minus, X, Loader2, Flame, Wheat, Beef, Droplets, Apple, Candy, Salad } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchFoods, logFoodFromLibrary, FoodSearchResult } from '@/lib/api/food-search';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface FoodLibraryProps {
  onClose: () => void;
}

const FoodLibrary = ({ onClose }: FoodLibraryProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLogging, setIsLogging] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const search = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const foods = await searchFoods(debouncedQuery);
        setResults(foods);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedQuery]);

  const handleLogFood = async () => {
    if (!user || !selectedFood) return;

    setIsLogging(true);
    try {
      await logFoodFromLibrary(user.id, selectedFood, quantity);
      toast({
        title: 'Food logged!',
        description: `${selectedFood.name} - ${Math.round(selectedFood.calories * quantity)} calories`
      });
      setSelectedFood(null);
      setQuantity(1);
    } catch (error) {
      console.error('Error logging food:', error);
      toast({
        title: 'Error',
        description: 'Failed to log food',
        variant: 'destructive'
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onClose} className="p-2 -ml-2">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Food Library</h1>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search 1M+ foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-0 h-12 rounded-xl"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-48">
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!isSearching && results.length === 0 && searchQuery.length >= 2 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No foods found for "{searchQuery}"</p>
          </div>
        )}

        {!isSearching && results.length === 0 && searchQuery.length < 2 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Start typing to search foods</p>
          </div>
        )}

        <div className="space-y-2">
          {results.map((food) => (
            <button
              key={food.id}
              onClick={() => setSelectedFood(food)}
              className="w-full p-4 bg-card rounded-xl flex items-center gap-3 text-left hover:bg-card/80 transition-colors"
            >
              {food.image ? (
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-12 h-12 rounded-lg object-cover bg-muted"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-lg">
                  🍽️
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{food.name}</p>
                {food.brand && (
                  <p className="text-sm text-muted-foreground truncate">{food.brand}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fats}g
                </p>
              </div>
              <Plus className="w-5 h-5 text-primary flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Selected Food Modal */}
      {selectedFood && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-3xl p-6 pb-20 safe-area-bottom animate-in slide-in-from-bottom">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />

            <div className="flex items-start gap-4 mb-6">
              {selectedFood.image ? (
                <img
                  src={selectedFood.image}
                  alt={selectedFood.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl">
                  🍽️
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedFood.name}</h3>
                {selectedFood.brand && (
                  <p className="text-muted-foreground">{selectedFood.brand}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">{selectedFood.servingSize}</p>
              </div>
              <button onClick={() => setSelectedFood(null)} className="p-2 -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slidable Nutrition Grid */}
            <div className="relative mb-6">
              <div
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 pb-2"
                onScroll={(e) => {
                  const scrollLeft = e.currentTarget.scrollLeft;
                  const width = e.currentTarget.offsetWidth;
                  const page = Math.round(scrollLeft / width);
                  if (page !== activePage) setActivePage(page);
                }}
              >
                {/* Page 1: Macros */}
                <div className="w-full shrink-0 snap-center">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                        <Flame className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Calories</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round(selectedFood.calories * quantity)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Droplets className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Fats</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((selectedFood.fats || 0) * quantity)}g
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <Beef className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Protein</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((selectedFood.protein || 0) * quantity)}g
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                        <Wheat className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Carbs</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((selectedFood.carbs || 0) * quantity)}g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page 2: Micronutrients */}
                <div className="w-full shrink-0 snap-center pl-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                        <Apple className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Fiber</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((selectedFood.fiber || 0) * quantity)}g
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
                        <Candy className="w-5 h-5 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Sugar</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((selectedFood.sugar || 0) * quantity)}g
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                        <Salad className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Sodium</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((selectedFood.sodium || 0) * quantity)}mg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-1.5 mt-2">
                {[0, 1].map((page) => (
                  <div
                    key={page}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activePage === page ? 'w-4 bg-primary' : 'w-1.5 bg-muted'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="text-2xl font-semibold">{quantity}</p>
                <p className="text-sm text-muted-foreground">servings</p>
              </div>
              <button
                onClick={() => setQuantity(quantity + 0.5)}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <Button
              onClick={handleLogFood}
              disabled={isLogging}
              className="w-full h-14 text-lg rounded-xl mb-10"
            >
              {isLogging ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `Log ${Math.round(selectedFood.calories * quantity)} calories`
              )}
            </Button>

            <style>{`
              .scrollbar-none::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-none {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodLibrary;
