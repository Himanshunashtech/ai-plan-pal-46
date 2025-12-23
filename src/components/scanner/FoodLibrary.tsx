import { useState, useEffect } from 'react';
import { Search, Plus, Minus, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
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
                <OptimizedImage
                  src={food.image}
                  alt={food.name}
                  className="w-12 h-12 rounded-lg object-cover bg-muted"
                  useCdnTransform={false}
                  fallback={
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-lg">
                      🍽️
                    </div>
                  }
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
          <div className="w-full bg-card rounded-t-3xl p-6 pb-10 safe-area-bottom animate-in slide-in-from-bottom">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />

            <div className="flex items-start gap-4 mb-6">
              {selectedFood.image ? (
                <OptimizedImage
                  src={selectedFood.image}
                  alt={selectedFood.name}
                  className="w-16 h-16 rounded-xl object-cover"
                  useCdnTransform={false}
                  fallback={
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                  }
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

            {/* Nutrition per serving */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-lg font-semibold">{Math.round(selectedFood.calories * quantity)}</p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-lg font-semibold">{Math.round(selectedFood.protein * quantity)}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-lg font-semibold">{Math.round(selectedFood.carbs * quantity)}g</p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-lg font-semibold">{Math.round(selectedFood.fats * quantity)}g</p>
                <p className="text-xs text-muted-foreground">Fats</p>
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
              className="w-full h-14 text-lg rounded-xl"
            >
              {isLogging ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `Log ${Math.round(selectedFood.calories * quantity)} calories`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodLibrary;
