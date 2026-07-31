import LoginForm from "@/components/forms/LoginForm";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white via-brand-lighter/10 to-gray-50/70 p-6">
      {/* Fading Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 bg-grid-pattern pointer-events-none"
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
      />
      {/* Subtle radial brand glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(var(--brand-primary-rgb),0.07),transparent)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <h1 className="mb-10 text-center text-5xl sm:text-6xl text-gray-950 font-sail drop-shadow-sm">
          Welcome Back
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
