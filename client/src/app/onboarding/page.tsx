import { completeOnboarding } from './actions'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 space-y-6 border">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 font-bold mb-2">
            🏢
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Setup Your Workspace
          </h1>
          <p className="text-sm text-gray-500">
            Tell us about your business to configure your review management hub.
          </p>
        </div>

        <form action={completeOnboarding} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Business / Brand Name
            </label>
            <input
              name="businessName"
              type="text"
              required
              placeholder="e.g. Apex Fitness Chain"
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              First Location Name
            </label>
            <input
              name="locationName"
              type="text"
              required
              placeholder="e.g. Gangnam Branch"
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Google Business Name or Place ID
            </label>
            <input
              name="googlePlaceId"
              placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <p className="text-xs text-gray-500">
              Optional: Links your workspace directly to Google Maps data.
            </p>
          </div> */}

          <button
            type="submit"
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition shadow-sm text-sm"
          >
            Complete Setup & Launch Dashboard →
          </button>
        </form>
      </div>
    </div>
  )
}
