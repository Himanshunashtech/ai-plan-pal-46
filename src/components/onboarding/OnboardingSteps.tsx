import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { nextStep, updateData, setGeneratedPlan } from '@/store/slices/onboardingSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WheelPicker } from '@/components/ui/WheelPicker';
import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculatePlan } from '@/lib/nutrition-calculator';

const OnboardingSteps = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { step, data } = useSelector((state: RootState) => state.onboarding);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = () => {
    if (step === 14) {
      generatePlan();
    } else {
      dispatch(nextStep());
    }
  };

  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("Analyzing your profile...");

  const generatePlan = async () => {
    setIsGenerating(true);

    // Multi-step progress simulation
    const steps = [
      { p: 15, s: "Analyzing your metabolic profile..." },
      { p: 35, s: "Calculating optimal deficit..." },
      { p: 55, s: "Estimating your metabolic age..." },
      { p: 85, s: "Perfecting your macro split..." },
      { p: 100, s: "Your plan is ready!" }
    ];

    let currentP = 0;
    for (const step of steps) {
      setGenerationStatus(step.s);
      const targetP = step.p;
      const diff = targetP - currentP;
      const frames = 30; // 30 frames per segment for smoothness
      const frameDuration = 40; // 40ms per frame

      for (let i = 1; i <= frames; i++) {
        const progress = currentP + (diff * (i / frames));
        setGenerationProgress(Math.round(progress));
        await new Promise(r => setTimeout(r, frameDuration));
      }
      currentP = targetP;
      await new Promise(r => setTimeout(r, 100));
    }

    // Calculate plan based on user data
    const plan = calculatePlan(data);
    dispatch(setGeneratedPlan(plan));

    setIsGenerating(false);
    navigate('/plan-ready');
  };

  const handleOptionSelect = (key: string, value: any) => {
    dispatch(updateData({ [key]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return !!data.fullName?.trim();
      case 2: return !!data.gender;
      case 3: return true; // Default value exists
      case 4: return true; // Default value exists
      case 5: return true; // Default value exists
      case 6: return !!data.goal;
      case 7: return true; // Default value exists
      case 8: return true; // New Interstitial
      case 9: return true; // New Interstitial
      case 10: return !!data.activityLevel;
      case 11: return !!data.dietType;
      case 12: return true; // Default value exists (was 13)
      case 13: return true; // (was 14)
      case 14: return true; // (was 15)
      default: return true;
    }
  };

  const renderStep = () => {
    if (isGenerating) {
      return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-sm mb-12">
              <div className="flex items-end justify-center mb-6">
                <span className="text-xl font-black text-foreground tracking-tighter">{generationProgress}%</span>
              </div>

              <div className="w-full h-3 bg-muted/20 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${generationProgress}%` }}
                />
                <div
                  className="absolute top-0 left-0 h-full bg-primary/30 blur-sm transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>

            <p className="text-muted-foreground text-lg mb-12 h-8 transition-all duration-700 ease-in-out font-medium">{generationStatus}</p>

            <div className="w-full max-w-sm bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-left">Daily recommendation for</h3>
              <div className="space-y-4">
                {[
                  { label: 'Calories', p: 20, delay: '75ms' },
                  { label: 'Carbs', p: 40, delay: '150ms' },
                  { label: 'Protein', p: 60, delay: '225ms' },
                  { label: 'Fats', p: 80, delay: '300ms' },

                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center justify-between group transition-all duration-700 ease-out",
                      generationProgress >= item.p ? "opacity-100 translate-y-0" : "opacity-40 translate-y-1"
                    )}
                    style={{ transitionDelay: generationProgress >= item.p ? item.delay : '0ms' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-500",
                        generationProgress >= item.p ? "bg-primary scale-110" : "bg-muted-foreground/30 scale-100"
                      )} />
                      <span className={cn(
                        "text-lg font-medium transition-colors duration-500",
                        generationProgress >= item.p ? "text-foreground" : "text-muted-foreground/40"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) transform",
                      generationProgress >= item.p ? "bg-foreground text-background scale-100 rotate-0" : "bg-muted/30 scale-50 rotate-[-45deg]"
                    )}>
                      {generationProgress >= item.p && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 px-3">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Step 1 • Let's get started</span>
              <h2 className="text-2xl font-bold mb-2 mt-2 text-foreground">What's your name?</h2>
              <p className="text-muted-foreground mb-8">We'd love to get to know you better. We're here to help.</p>
              <Input
                placeholder="Enter your name"
                value={data.fullName || ''}
                onChange={(e) => dispatch(updateData({ fullName: e.target.value }))}
                className="h-14 text-lg rounded-2xl"
                autoFocus
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Step 2 • Basic Info</span>
              <h2 className="text-2xl font-bold mb-2 mt-2 text-foreground">Choose your Gender</h2>
              <p className="text-muted-foreground mb-8">This will be used to calibrate your custom plan.</p>
              <div className="space-y-3">
                {[
                  { value: 'male', label: 'Male', icon: '👨' },
                  { value: 'female', label: 'Female', icon: '👩' },
                  { value: 'other', label: 'Other', icon: '🧑' }
                ].map((g) => (
                  <Button
                    key={g.value}
                    variant={data.gender === g.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full justify-start gap-3"
                    onClick={() => handleOptionSelect('gender', g.value)}
                  >
                    <span>{g.icon}</span>
                    {g.label}
                    {data.gender === g.value && <Check className="w-5 h-5 ml-auto" />}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2 text-foreground">How old are you?</h2>
              <p className="text-muted-foreground mb-12">Your age helps us calculate your metabolism.</p>
              <WheelPicker
                value={data.age || 25}
                min={13}
                max={100}
                onChange={(value) => dispatch(updateData({ age: value }))}
                className="w-full max-w-xs"
              />
            </div>
          </div>
        );

      case 4:
        const isFt = data.heightUnit === 'ft';
        const height = data.height || (isFt ? 67 : 170); // Default to 67 inches (5'7") or 170 cm
        const feet = Math.floor(height / 12);
        const inches = Math.round(height % 12);

        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What's your height?</h2>
              <p className="text-muted-foreground mb-8">Enter your height to personalize your plan.</p>
              <div className="flex gap-2 mb-12 w-full max-w-xs">
                <Button
                  variant={data.heightUnit === 'cm' ? 'default' : 'outline'}
                  onClick={() => dispatch(updateData({ heightUnit: 'cm' }))}
                  className="flex-1"
                >
                  cm
                </Button>
                <Button
                  variant={data.heightUnit === 'ft' ? 'default' : 'outline'}
                  onClick={() => dispatch(updateData({ heightUnit: 'ft' }))}
                  className="flex-1"
                >
                  ft
                </Button>
              </div>

              {isFt ? (
                <div className="flex gap-8 items-center justify-center w-full max-w-xs">
                  <div className="flex flex-col items-center flex-1">
                    <WheelPicker
                      value={feet}
                      min={4}
                      max={8}
                      onChange={(f) => dispatch(updateData({ height: f * 12 + inches }))}
                      className="w-full"
                    />
                    <span className="text-muted-foreground mt-4 font-bold">ft</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <WheelPicker
                      value={inches}
                      min={0}
                      max={11}
                      onChange={(i) => dispatch(updateData({ height: feet * 12 + i }))}
                      className="w-full"
                    />
                    <span className="text-muted-foreground mt-4 font-bold">in</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full max-w-xs">
                  <WheelPicker
                    value={height}
                    min={120}
                    max={220}
                    onChange={(value) => dispatch(updateData({ height: value }))}
                    className="w-full"
                  />
                  <span className="text-muted-foreground mt-4 font-bold">cm</span>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What's your current weight?</h2>
              <p className="text-muted-foreground mb-6">We'll use this to track your progress.</p>
              <div className="flex gap-2 mb-12 w-full max-w-xs">
                <Button
                  variant={data.weightUnit === 'kg' ? 'default' : 'outline'}
                  onClick={() => dispatch(updateData({ weightUnit: 'kg' }))}
                  className="flex-1"
                >
                  kg
                </Button>
                <Button
                  variant={data.weightUnit === 'lbs' ? 'default' : 'outline'}
                  onClick={() => dispatch(updateData({ weightUnit: 'lbs' }))}
                  className="flex-1"
                >
                  lbs
                </Button>
              </div>
              <WheelPicker
                value={data.currentWeight || 70}
                min={data.weightUnit === 'lbs' ? 80 : 30}
                max={data.weightUnit === 'lbs' ? 400 : 200}
                onChange={(value) => dispatch(updateData({ currentWeight: value }))}
                className="w-full max-w-xs"
              />
              <span className="text-xl font-bold mt-4 text-primary uppercase">{data.weightUnit || 'kg'}</span>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What is your goal?</h2>
              <p className="text-muted-foreground mb-8">Select your primary fitness goal.</p>
              <div className="space-y-3">
                {[
                  { value: 'lose', label: 'Lose weight', desc: 'Reduce body fat and get leaner' },
                  { value: 'maintain', label: 'Maintain weight', desc: 'Keep your current physique' },
                  { value: 'gain', label: 'Gain muscle', desc: 'Build muscle and strength' }
                ].map((g) => (
                  <Button
                    key={g.value}
                    variant={data.goal === g.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full flex-col items-start h-auto py-4"
                    onClick={() => handleOptionSelect('goal', g.value)}
                  >
                    <span className="font-semibold">{g.label}</span>
                    <span className="text-sm text-muted-foreground">{g.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What's your target weight?</h2>
              <p className="text-muted-foreground mb-12">Set your goal weight.</p>
              <WheelPicker
                value={data.targetWeight || (data.currentWeight || 70) - 5}
                min={data.weightUnit === 'lbs' ? 80 : 30}
                max={data.weightUnit === 'lbs' ? 400 : 200}
                onChange={(value) => dispatch(updateData({ targetWeight: value }))}
                className="w-full max-w-xs"
              />
              <span className="text-xl font-bold mt-4 text-primary uppercase">{data.weightUnit || 'kg'}</span>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <span className="text-amber-500 font-bold mb-4">Goal & Focus</span>
              <h2 className="text-3xl font-bold mb-4 text-foreground leading-tight">Counting calories creates Long-term Effect</h2>


              <div className="w-full max-w-sm relative aspect-[4/3] bg-background/50 rounded-3xl p-6 border border-border/50 shadow-xl overflow-hidden mb-8">
                <div className="absolute top-4 left-6 text-muted-foreground text-sm font-medium">Your Weight</div>
                <div className="w-full h-full flex flex-col justify-end pt-12">
                  <div className="relative flex-1">
                    {/* Graph Background Lines */}
                    <div className="absolute inset-0 border-b border-dashed border-muted/20 pb-1/4"></div>
                    <div className="absolute inset-0 border-b border-dashed border-muted/20 pb-1/2"></div>
                    <div className="absolute inset-0 border-b border-dashed border-muted/20 pb-3/4"></div>

                    {/* Green AI Path */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d="M 5,20 Q 30,20 50,60 T 95,90"
                        fill="none"
                        stroke="rgb(34, 197, 94)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="5" cy="20" r="3" fill="rgb(34, 197, 94)" />
                      <circle cx="95" cy="90" r="4" fill="white" stroke="rgb(34, 197, 94)" strokeWidth="2" />
                    </svg>

                    {/* Red Traditional Path */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d="M 5,20 Q 30,30 50,50 T 95,10"
                        fill="none"
                        stroke="rgb(239, 68, 68)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="4 2"
                      />
                      <circle cx="95" cy="10" r="3" fill="rgb(239, 68, 68)" />
                    </svg>

                    {/* Labels */}
                    <div className="absolute bottom-[5%] left-[5%] text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">With AI Calorie Counter</div>
                    <div className="absolute top-[45%] right-[5%] text-[10px] font-bold text-red-500 opacity-80">Traditonal Diet</div>
                  </div>
                  <div className="flex justify-between items-center mt-4 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Month 1</span>
                    <span>Month 6</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="Expert" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Supported by <span className="text-foreground font-bold">16,473</span> experts
                </p>
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-start text-center px-4 pt-8">
              <span className="text-amber-500 font-bold mb-6">Goal & Focus</span>

              <div className="relative w-64 h-64 mb-12">
                <div className="absolute inset-0 bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative z-10 w-full h-full rounded-full border-4 border-background overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop"
                    alt="Support"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating Badges */}
                <div className="absolute -top-2 -left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-xl animate-bounce-slow">💪</div>
                <div className="absolute top-2 -right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-xl animate-bounce-slow [animation-delay:0.5s]">🤝</div>
                <div className="absolute bottom-4 -right-2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl animate-pulse">❤️</div>
              </div>

              <h2 className="text-4xl font-bold mb-4 text-foreground leading-tight">We're here for you!</h2>

            </div>
          </div>
        );

      case 10:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">How active are you?</h2>
              <p className="text-muted-foreground mb-8">Your activity level affects calorie needs.</p>
              <div className="space-y-3">
                {[
                  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
                  { value: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                  { value: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                  { value: 'active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
                ].map((a) => (
                  <Button
                    key={a.value}
                    variant={data.activityLevel === a.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full flex-col items-start h-auto py-3"
                    onClick={() => handleOptionSelect('activityLevel', a.value)}
                  >
                    <span className="font-semibold">{a.label}</span>
                    <span className="text-xs text-muted-foreground">{a.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 11:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What diet do you follow?</h2>
              <p className="text-muted-foreground mb-8">Select your dietary preference.</p>
              <div className="space-y-3">
                {[
                  { value: 'none', label: 'No specific diet' },
                  { value: 'vegetarian', label: 'Vegetarian' },
                  { value: 'vegan', label: 'Vegan' },
                  { value: 'keto', label: 'Keto' },
                  { value: 'paleo', label: 'Paleo' }
                ].map((d) => (
                  <Button
                    key={d.value}
                    variant={data.dietType === d.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full"
                    onClick={() => handleOptionSelect('dietType', d.value)}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 12:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2 text-foreground">How often do you exercise?</h2>
              <p className="text-muted-foreground mb-12">Days per week you work out.</p>
              <WheelPicker
                value={data.exerciseFrequency || 3}
                min={0}
                max={7}
                onChange={(value) => dispatch(updateData({ exerciseFrequency: value }))}
                className="w-full max-w-xs"
              />
              <span className="text-xl font-bold mt-4 text-primary uppercase">days</span>
            </div>
          </div>
        );

      case 13:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Great job!</h2>
              <p className="text-muted-foreground mb-8">
                You've completed all the questions. We're now ready to create your personalized nutrition plan based on your goals and preferences.
              </p>
              <div className="bg-secondary/50 rounded-2xl p-6 w-full">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-semibold text-foreground capitalize">{data.goal || 'Lose weight'}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Current weight</span>
                  <span className="font-semibold text-foreground">{data.currentWeight || 70} {data.weightUnit || 'kg'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target weight</span>
                  <span className="font-semibold text-foreground">{data.targetWeight || 65} {data.weightUnit || 'kg'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 14:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-5xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Calo AI creates long-term results</h2>
              <p className="text-muted-foreground mb-8">
                Our AI-powered system analyzes your unique profile to create a sustainable nutrition plan that adapts to your lifestyle and helps you achieve lasting results.
              </p>
              <div className="flex gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">94%</div>
                  <div className="text-xs text-muted-foreground">Success rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">2M+</div>
                  <div className="text-xs text-muted-foreground">Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">4.8★</div>
                  <div className="text-xs text-muted-foreground">App rating</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div key={step} className="flex-1 overflow-y-auto pb-4 animate-pop-in">
        {renderStep()}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-background  pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button
          size="lg"
          className="w-full transition-all duration-300"
          onClick={handleNext}
          disabled={isGenerating || !isStepValid()}
          style={{
            opacity: isStepValid() ? 1 : 0.5,
            backgroundColor: isStepValid() ? 'hsl(var(--foreground))' : undefined,
            color: isStepValid() ? 'hsl(var(--background))' : undefined
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Plan...
            </>
          ) : step === 14 ? (
            'Generate My Plan'
          ) : step === 9 ? (
            'Sounds Great'
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>

  );
};

export default OnboardingSteps;
