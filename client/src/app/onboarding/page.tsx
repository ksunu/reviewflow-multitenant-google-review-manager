import { OnboardingForm } from './onboarding-form'

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 text-card-foreground shadow-xl shadow-black/20">
        <div className="space-y-2 text-center">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            🏢
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Setup Your Workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Tell us about your business and first location to set up your review
            management hub.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  )
}
