import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

const OnboardingSteps = () => {
  const navigate = useNavigate();
  const { step, data, updateData, nextStep, setGeneratedPlan } = useOnboarding();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = () => {
    if (step === 27) {
      generatePlan();
    } else {
      nextStep();
    }
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    // Simulate AI plan generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate plan based on user data
    const bmr = data.gender === 'male' 
      ? 88.362 + (13.397 * (data.currentWeight || 70)) + (4.799 * (data.height || 170)) - (5.677 * (data.age || 25))
      : 447.593 + (9.247 * (data.currentWeight || 60)) + (3.098 * (data.height || 160)) - (4.330 * (data.age || 25));
    
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    const tdee = bmr * (activityMultipliers[data.activityLevel || 'moderate'] || 1.55);
    let dailyCalories = Math.round(tdee);
    
    if (data.goal === 'lose') dailyCalories -= 500;
    if (data.goal === 'gain') dailyCalories += 300;
    
    setGeneratedPlan({
      dailyCalories,
      dailyCarbs: Math.round(dailyCalories * 0.45 / 4),
      dailyProtein: Math.round(dailyCalories * 0.30 / 4),
      dailyFats: Math.round(dailyCalories * 0.25 / 9),
      targetWeight: data.targetWeight || data.currentWeight || 65,
      recommendation: data.goal === 'lose' 
        ? 'Based on your profile, we recommend a moderate calorie deficit for sustainable weight loss.'
        : data.goal === 'gain'
        ? 'Based on your profile, we recommend a slight calorie surplus to support muscle growth.'
        : 'Based on your profile, we recommend maintaining your current intake for stable weight.'
    });
    
    setIsGenerating(false);
    navigate('/plan-ready');
  };

  const handleOptionSelect = (key: string, value: any) => {
    updateData({ [key]: value });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Step 1 • Let's get started</span>
              <h2 className="text-2xl font-bold mb-2 mt-2 text-foreground">What's your name?</h2>
              <p className="text-muted-foreground mb-8">We'd love to get to know you better.</p>
              <Input
                placeholder="Enter your name"
                value={data.fullName || ''}
                onChange={(e) => updateData({ fullName: e.target.value })}
                className="h-14 text-lg rounded-2xl"
                autoFocus
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in flex flex-col h-full">
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
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">How old are you?</h2>
              <p className="text-muted-foreground mb-8">Your age helps us calculate your metabolism.</p>
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-bold text-foreground">{data.age || 25}</div>
                <Slider
                  value={[data.age || 25]}
                  onValueChange={(value) => updateData({ age: value[0] })}
                  min={13}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between w-full text-sm text-muted-foreground">
                  <span>13</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What's your height?</h2>
              <p className="text-muted-foreground mb-8">Enter your height to personalize your plan.</p>
              <div className="flex gap-2 mb-6">
                <Button
                  variant={data.heightUnit === 'cm' ? 'default' : 'outline'}
                  onClick={() => updateData({ heightUnit: 'cm' })}
                  className="flex-1"
                >
                  cm
                </Button>
                <Button
                  variant={data.heightUnit === 'ft' ? 'default' : 'outline'}
                  onClick={() => updateData({ heightUnit: 'ft' })}
                  className="flex-1"
                >
                  ft
                </Button>
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-bold text-foreground">
                  {data.height || 170}
                  <span className="text-2xl ml-1">{data.heightUnit || 'cm'}</span>
                </div>
                <Slider
                  value={[data.height || 170]}
                  onValueChange={(value) => updateData({ height: value[0] })}
                  min={data.heightUnit === 'ft' ? 4 : 120}
                  max={data.heightUnit === 'ft' ? 8 : 220}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What motivates you?</h2>
              <p className="text-muted-foreground mb-8">Select all that apply to you.</p>
              <div className="space-y-3">
                {[
                  { value: 'health', label: 'Improve overall health', icon: '❤️' },
                  { value: 'energy', label: 'Have more energy', icon: '⚡' },
                  { value: 'confidence', label: 'Feel more confident', icon: '💪' },
                  { value: 'fitness', label: 'Get in better shape', icon: '🏃' },
                  { value: 'longevity', label: 'Live a longer life', icon: '🌟' }
                ].map((m) => {
                  const isSelected = data.motivation?.includes(m.value);
                  return (
                    <Button
                      key={m.value}
                      variant={isSelected ? 'option-selected' : 'option'}
                      size="lg"
                      className="w-full justify-start gap-3"
                      onClick={() => {
                        const current = data.motivation || [];
                        if (isSelected) {
                          updateData({ motivation: current.filter((v: string) => v !== m.value) });
                        } else {
                          updateData({ motivation: [...current, m.value] });
                        }
                      }}
                    >
                      <span>{m.icon}</span>
                      {m.label}
                      {isSelected && <Check className="w-5 h-5 ml-auto" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What's your current weight?</h2>
              <p className="text-muted-foreground mb-8">We'll use this to track your progress.</p>
              <div className="flex gap-2 mb-6">
                <Button
                  variant={data.weightUnit === 'kg' ? 'default' : 'outline'}
                  onClick={() => updateData({ weightUnit: 'kg' })}
                  className="flex-1"
                >
                  kg
                </Button>
                <Button
                  variant={data.weightUnit === 'lbs' ? 'default' : 'outline'}
                  onClick={() => updateData({ weightUnit: 'lbs' })}
                  className="flex-1"
                >
                  lbs
                </Button>
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-bold text-foreground">
                  {data.currentWeight || 70}
                  <span className="text-2xl ml-1">{data.weightUnit || 'kg'}</span>
                </div>
                <Slider
                  value={[data.currentWeight || 70]}
                  onValueChange={(value) => updateData({ currentWeight: value[0] })}
                  min={data.weightUnit === 'lbs' ? 80 : 30}
                  max={data.weightUnit === 'lbs' ? 400 : 200}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="animate-fade-in flex flex-col h-full">
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

      case 8:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What's your target weight?</h2>
              <p className="text-muted-foreground mb-8">Set your goal weight.</p>
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-bold text-foreground">
                  {data.targetWeight || (data.currentWeight || 70) - 5}
                  <span className="text-2xl ml-1">{data.weightUnit || 'kg'}</span>
                </div>
                <Slider
                  value={[data.targetWeight || (data.currentWeight || 70) - 5]}
                  onValueChange={(value) => updateData({ targetWeight: value[0] })}
                  min={data.weightUnit === 'lbs' ? 80 : 30}
                  max={data.weightUnit === 'lbs' ? 400 : 200}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">How active are you?</h2>
              <p className="text-muted-foreground mb-8">Your activity level affects calorie needs.</p>
              <div className="space-y-3">
                {[
                  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
                  { value: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                  { value: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                  { value: 'active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
                  { value: 'very_active', label: 'Extra Active', desc: 'Very hard exercise & physical job' }
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

      case 10:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Weekly weight goal?</h2>
              <p className="text-muted-foreground mb-8">How fast do you want to reach your goal?</p>
              <div className="space-y-3">
                {[
                  { value: 0.25, label: '0.25 kg/week', desc: 'Slow & steady' },
                  { value: 0.5, label: '0.5 kg/week', desc: 'Recommended' },
                  { value: 0.75, label: '0.75 kg/week', desc: 'Moderate' },
                  { value: 1, label: '1 kg/week', desc: 'Aggressive' }
                ].map((w) => (
                  <Button
                    key={w.value}
                    variant={data.weeklyGoal === w.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full justify-between"
                    onClick={() => handleOptionSelect('weeklyGoal', w.value)}
                  >
                    <span>{w.label}</span>
                    <span className="text-sm text-muted-foreground">{w.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 11:
        return (
          <div className="animate-fade-in flex flex-col h-full">
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
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Any food allergies?</h2>
              <p className="text-muted-foreground mb-8">Select all that apply.</p>
              <div className="space-y-3">
                {['None', 'Dairy', 'Gluten', 'Nuts', 'Soy', 'Eggs', 'Shellfish'].map((allergy) => {
                  const isSelected = data.allergies?.includes(allergy);
                  return (
                    <Button
                      key={allergy}
                      variant={isSelected ? 'option-selected' : 'option'}
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        const current = data.allergies || [];
                        if (allergy === 'None') {
                          updateData({ allergies: ['None'] });
                        } else {
                          const filtered = current.filter(a => a !== 'None');
                          if (isSelected) {
                            updateData({ allergies: filtered.filter(a => a !== allergy) });
                          } else {
                            updateData({ allergies: [...filtered, allergy] });
                          }
                        }
                      }}
                    >
                      {allergy}
                      {isSelected && <Check className="w-5 h-5 ml-auto" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 13:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">How many meals per day?</h2>
              <p className="text-muted-foreground mb-8">We'll help you plan your meals.</p>
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-bold text-foreground">{data.mealsPerDay || 3}</div>
                <Slider
                  value={[data.mealsPerDay || 3]}
                  onValueChange={(value) => updateData({ mealsPerDay: value[0] })}
                  min={1}
                  max={6}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between w-full text-sm text-muted-foreground">
                  <span>1 meal</span>
                  <span>6 meals</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 14:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Daily water intake goal?</h2>
              <p className="text-muted-foreground mb-8">Staying hydrated is key to success.</p>
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-bold text-foreground">
                  {data.waterIntake || 8}
                  <span className="text-2xl ml-1">glasses</span>
                </div>
                <Slider
                  value={[data.waterIntake || 8]}
                  onValueChange={(value) => updateData({ waterIntake: value[0] })}
                  min={4}
                  max={16}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 15:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">How many hours of sleep?</h2>
              <p className="text-muted-foreground mb-8">Sleep affects your metabolism and recovery.</p>
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-bold text-foreground">
                  {data.sleepHours || 7}
                  <span className="text-2xl ml-1">hours</span>
                </div>
                <Slider
                  value={[data.sleepHours || 7]}
                  onValueChange={(value) => updateData({ sleepHours: value[0] })}
                  min={4}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 16:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Your stress level?</h2>
              <p className="text-muted-foreground mb-8">Stress can impact your weight goals.</p>
              <div className="space-y-3">
                {[
                  { value: 'low', label: 'Low', desc: 'Rarely stressed' },
                  { value: 'medium', label: 'Medium', desc: 'Sometimes stressed' },
                  { value: 'high', label: 'High', desc: 'Often stressed' }
                ].map((s) => (
                  <Button
                    key={s.value}
                    variant={data.stressLevel === s.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full justify-between"
                    onClick={() => handleOptionSelect('stressLevel', s.value)}
                  >
                    <span>{s.label}</span>
                    <span className="text-sm text-muted-foreground">{s.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 17:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">What motivates you?</h2>
              <p className="text-muted-foreground mb-8">Select all that apply.</p>
              <div className="space-y-3">
                {['Look better', 'Feel healthier', 'More energy', 'Improve confidence', 'Medical reasons', 'Sports performance'].map((m) => {
                  const isSelected = data.motivation?.includes(m);
                  return (
                    <Button
                      key={m}
                      variant={isSelected ? 'option-selected' : 'option'}
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        const current = data.motivation || [];
                        if (isSelected) {
                          updateData({ motivation: current.filter(x => x !== m) });
                        } else {
                          updateData({ motivation: [...current, m] });
                        }
                      }}
                    >
                      {m}
                      {isSelected && <Check className="w-5 h-5 ml-auto" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 18:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Tried diets before?</h2>
              <p className="text-muted-foreground mb-8">Have you attempted weight loss diets in the past?</p>
              <div className="space-y-3">
                {[
                  { value: true, label: 'Yes, I have' },
                  { value: false, label: 'No, this is my first time' }
                ].map((p) => (
                  <Button
                    key={String(p.value)}
                    variant={data.previousDiets === p.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full"
                    onClick={() => handleOptionSelect('previousDiets', p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 19:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Time for cooking?</h2>
              <p className="text-muted-foreground mb-8">How much time can you spend on meal prep?</p>
              <div className="space-y-3">
                {[
                  { value: 'minimal', label: 'Minimal', desc: '15 mins or less' },
                  { value: 'moderate', label: 'Moderate', desc: '15-45 mins' },
                  { value: 'plenty', label: 'Plenty', desc: '45+ mins' }
                ].map((c) => (
                  <Button
                    key={c.value}
                    variant={data.cookingTime === c.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full justify-between"
                    onClick={() => handleOptionSelect('cookingTime', c.value)}
                  >
                    <span>{c.label}</span>
                    <span className="text-sm text-muted-foreground">{c.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 20:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Snacking habits?</h2>
              <p className="text-muted-foreground mb-8">How often do you snack between meals?</p>
              <div className="space-y-3">
                {[
                  { value: 'rarely', label: 'Rarely', desc: 'Almost never' },
                  { value: 'sometimes', label: 'Sometimes', desc: 'A few times a week' },
                  { value: 'often', label: 'Often', desc: 'Every day' }
                ].map((s) => (
                  <Button
                    key={s.value}
                    variant={data.snacking === s.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full justify-between"
                    onClick={() => handleOptionSelect('snacking', s.value)}
                  >
                    <span>{s.label}</span>
                    <span className="text-sm text-muted-foreground">{s.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 21:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">How often do you exercise?</h2>
              <p className="text-muted-foreground mb-8">Days per week you work out.</p>
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-bold text-foreground">
                  {data.exerciseFrequency || 3}
                  <span className="text-2xl ml-1">days</span>
                </div>
                <Slider
                  value={[data.exerciseFrequency || 3]}
                  onValueChange={(value) => updateData({ exerciseFrequency: value[0] })}
                  min={0}
                  max={7}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case 22:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Types of exercise?</h2>
              <p className="text-muted-foreground mb-8">Select all that apply.</p>
              <div className="space-y-3">
                {['Walking', 'Running', 'Gym/Weights', 'Yoga', 'Swimming', 'Cycling', 'Sports', 'None'].map((e) => {
                  const isSelected = data.exerciseType?.includes(e);
                  return (
                    <Button
                      key={e}
                      variant={isSelected ? 'option-selected' : 'option'}
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        const current = data.exerciseType || [];
                        if (e === 'None') {
                          updateData({ exerciseType: ['None'] });
                        } else {
                          const filtered = current.filter(x => x !== 'None');
                          if (isSelected) {
                            updateData({ exerciseType: filtered.filter(x => x !== e) });
                          } else {
                            updateData({ exerciseType: [...filtered, e] });
                          }
                        }
                      }}
                    >
                      {e}
                      {isSelected && <Check className="w-5 h-5 ml-auto" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 23:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Any health conditions?</h2>
              <p className="text-muted-foreground mb-8">Select all that apply.</p>
              <div className="space-y-3">
                {['None', 'Diabetes', 'High blood pressure', 'Heart disease', 'Thyroid issues', 'PCOS', 'Other'].map((h) => {
                  const isSelected = data.healthConditions?.includes(h);
                  return (
                    <Button
                      key={h}
                      variant={isSelected ? 'option-selected' : 'option'}
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        const current = data.healthConditions || [];
                        if (h === 'None') {
                          updateData({ healthConditions: ['None'] });
                        } else {
                          const filtered = current.filter(x => x !== 'None');
                          if (isSelected) {
                            updateData({ healthConditions: filtered.filter(x => x !== h) });
                          } else {
                            updateData({ healthConditions: [...filtered, h] });
                          }
                        }
                      }}
                    >
                      {h}
                      {isSelected && <Check className="w-5 h-5 ml-auto" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 24:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Taking any medications?</h2>
              <p className="text-muted-foreground mb-8">Some medications can affect weight.</p>
              <div className="space-y-3">
                {[
                  { value: true, label: 'Yes' },
                  { value: false, label: 'No' }
                ].map((m) => (
                  <Button
                    key={String(m.value)}
                    variant={data.medications === m.value ? 'option-selected' : 'option'}
                    size="lg"
                    className="w-full"
                    onClick={() => handleOptionSelect('medications', m.value)}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 25:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-foreground">When do you want to reach your goal?</h2>
              <p className="text-muted-foreground mb-8">Set a target date for motivation.</p>
              <div className="space-y-3">
                {[
                  { months: 1, label: '1 month' },
                  { months: 3, label: '3 months' },
                  { months: 6, label: '6 months' },
                  { months: 12, label: '1 year' }
                ].map((t) => {
                  const targetDate = new Date();
                  targetDate.setMonth(targetDate.getMonth() + t.months);
                  const isSelected = data.targetDate?.getTime() === targetDate.getTime();
                  return (
                    <Button
                      key={t.months}
                      variant={isSelected ? 'option-selected' : 'option'}
                      size="lg"
                      className="w-full"
                      onClick={() => updateData({ targetDate })}
                    >
                      {t.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 26:
        return (
          <div className="animate-fade-in flex flex-col h-full">
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

      case 27:
        return (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-5xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Cal AI creates long-term results</h2>
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-4">{renderStep()}</div>
      <div className="flex-shrink-0 pt-4 pb-safe bg-background">
        <Button 
          size="lg" 
          className="w-full" 
          onClick={handleNext}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Plan...
            </>
          ) : step === 27 ? (
            'Generate My Plan'
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingSteps;
