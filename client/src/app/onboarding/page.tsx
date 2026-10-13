import { completeOnboarding } from './actions'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-xl shadow-xl shadow-black/20 p-8 space-y-6 border border-border">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold mb-2">
            🏢
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Setup Your Workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Tell us about your business to configure your review management hub.
          </p>
        </div>

        <form action={completeOnboarding} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Business / Brand Name
            </label>
            <input
              name="businessName"
              type="text"
              required
              placeholder="e.g. Apex Fitness Chain"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              First Location Name
            </label>
            <input
              name="locationName"
              type="text"
              required
              placeholder="e.g. Gangnam Branch"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Google Business Name or Place ID
            </label>
            <input
              name="googlePlaceId"
              placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Links your workspace directly to Google Maps data.
            </p>
          </div> */}

          <button
            type="submit"
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition shadow-sm shadow-primary/20 text-sm"
          >
            Complete Setup & Launch Dashboard →
          </button>
        </form>
      </div>
    </div>
  )
}
