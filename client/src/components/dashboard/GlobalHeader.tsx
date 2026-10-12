'use client'

import { useState } from 'react'

export function GlobalHeader() {
  const [selectedLocation, setSelectedLocation] = useState('all')

  return (
    <header className="border-b bg-white px-6 py-4 flex items-center justify-between shadow-xs">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          RP
        </div>
        <span className="font-bold text-lg tracking-tight text-gray-900">
          Review Manager
        </span>
      </div>

      {/* Location Switcher Dropdown */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-1.5">
          <span className="text-gray-500 text-sm">📍 Location:</span>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-transparent font-medium text-sm text-gray-800 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Locations (Aggregate)</option>
            <option value="gangnam">Gangnam Branch</option>
            <option value="itaewon">Itaewon Branch</option>
          </select>
        </div>

        {/* Profile / Settings Placeholder */}
        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-700 text-sm">
          M
        </div>
      </div>
    </header>
  )
}
