import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import v1 from "../assets/welcome-demo.mp4";
import PWAInstallButton from "@/components/ui/PWAInstallButton";


const Welcome = () => {

  const navigate = useNavigate();

  return (
    <div className="h-[100svh] bg-background flex flex-col overflow-hidden relative">
      {/* Top Right Corner - Clean install button */}
      <PWAInstallButton size="md" />

      {/* Alternative: Floating button with animation */}
      {/* <PWAInstallButton variant="floating" /> */}

      {/* Alternative: Simple icon button */}
      {/* <div className="absolute top-6 right-6">
        <PWAInstallButton variant="icon-only" />
      </div> */}

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
        <div className="rounded-[1.8rem] overflow-hidden">
          <video
            src={v1}
            className="w-full h-[360px] object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>

        <h1 className="text-2xl font-bold text-center leading-snug">
          Calorie tracking
          <br />
          made easy
        </h1>
      </div>

      {/* Bottom Actions */}
      <div className="px-5 pb-6 space-y-3">
        <Button
          size="lg"
          className="w-full h-14 text-lg rounded-2xl"
          onClick={() => navigate("/onboarding")}
        >
          Get Started
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/auth")}
            className="text-foreground font-semibold underline underline-offset-2"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Welcome;