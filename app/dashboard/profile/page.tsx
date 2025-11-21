"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase, getCurrentUser } from "@/lib/supabaseClient";
import { UserIcon, EnvelopeIcon, AcademicCapIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import NotificationSettings from "@/app/components/NotificationSettings";

type Profile = {
  id: string;
  name: string;
  email: string;
  icf_level: string;
  currency: string;
  country: string;
  cpd_renewal_date?: string | null;
  created_at: string;
  updated_at: string;
};

const ICF_LEVELS = [
  {
    value: "none",
    label: "No ICF Accreditation",
    description: "Not yet accredited by ICF"
  },
  {
    value: "acc",
    label: "Associate Certified Coach (ACC)",
    description: "Entry-level credential for coaches with beginner to intermediate experience. Requires 60+ hours of coach-specific training."
  },
  {
    value: "pcc",
    label: "Professional Certified Coach (PCC)",
    description: "Intermediate to advanced level credential. Requires 125+ hours of coach-specific training."
  },
  {
    value: "mcc",
    label: "Master Certified Coach (MCC)",
    description: "Highest level credential representing extensive experience and mastery. Requires 200+ hours of coach-specific training."
  }
];

const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)", symbol: "$" },
  { value: "EUR", label: "Euro (â‚¬)", symbol: "â‚¬" },
  { value: "GBP", label: "British Pound (Â£)", symbol: "Â£" },
  { value: "CAD", label: "Canadian Dollar (C$)", symbol: "C$" },
  { value: "AUD", label: "Australian Dollar (A$)", symbol: "A$" },
  { value: "JPY", label: "Japanese Yen (Â¥)", symbol: "Â¥" },
  { value: "CHF", label: "Swiss Franc (CHF)", symbol: "CHF" },
  { value: "NZD", label: "New Zealand Dollar (NZ$)", symbol: "NZ$" },
  { value: "SEK", label: "Swedish Krona (SEK)", symbol: "SEK" },
  { value: "NOK", label: "Norwegian Krone (NOK)", symbol: "NOK" },
  { value: "DKK", label: "Danish Krone (DKK)", symbol: "DKK" }
];

const COUNTRIES = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Belgium", label: "Belgium" },
  { value: "Switzerland", label: "Switzerland" },
  { value: "Austria", label: "Austria" },
  { value: "Sweden", label: "Sweden" },
  { value: "Norway", label: "Norway" },
  { value: "Denmark", label: "Denmark" },
  { value: "Finland", label: "Finland" },
  { value: "Ireland", label: "Ireland" },
  { value: "New Zealand", label: "New Zealand" },
  { value: "Japan", label: "Japan" },
  { value: "South Korea", label: "South Korea" },
  { value: "Singapore", label: "Singapore" },
  { value: "Hong Kong", label: "Hong Kong" },
  { value: "India", label: "India" },
  { value: "Brazil", label: "Brazil" },
  { value: "Mexico", label: "Mexico" },
  { value: "Argentina", label: "Argentina" },
  { value: "Chile", label: "Chile" },
  { value: "South Africa", label: "South Africa" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "Israel", label: "Israel" },
  { value: "Turkey", label: "Turkey" },
  { value: "Poland", label: "Poland" },
  { value: "Czech Republic", label: "Czech Republic" },
  { value: "Hungary", label: "Hungary" },
  { value: "Romania", label: "Romania" },
  { value: "Bulgaria", label: "Bulgaria" },
  { value: "Croatia", label: "Croatia" },
  { value: "Slovenia", label: "Slovenia" },
  { value: "Slovakia", label: "Slovakia" },
  { value: "Estonia", label: "Estonia" },
  { value: "Latvia", label: "Latvia" },
  { value: "Lithuania", label: "Lithuania" },
  { value: "Luxembourg", label: "Luxembourg" },
  { value: "Iceland", label: "Iceland" },
  { value: "Malta", label: "Malta" },
  { value: "Cyprus", label: "Cyprus" },
  { value: "Greece", label: "Greece" },
  { value: "Portugal", label: "Portugal" },
  { value: "Other", label: "Other" }
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // const [showUserExistsModal, setShowUserExistsModal] = useState(false); // Removed - no longer needed
  const [badgeUpdateTrigger, setBadgeUpdateTrigger] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    id: "",
    name: "",
    email: "",
    icf_level: "none",
    currency: "USD",
    country: "United States", // Default country
    cpd_renewal_date: null,
    created_at: "",
    updated_at: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { user, error: authError } = await getCurrentUser();
        if (authError) {
          // Don't redirect immediately on auth errors, might be temporary
          setLoading(false);
          return;
        }
        
        if (!user) {
          router.replace("/login");
          return;
        }

        // Fetch profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, email, icf_level, currency, country, cpd_renewal_date, created_at, updated_at")
          .eq("user_id", user.id)
          .single();


        if (!profileError && profileData) {
          setProfile({
            id: profileData.id,
            name: profileData.name || "",
            email: profileData.email || user.email || "",
            icf_level: profileData.icf_level || "none",
            currency: profileData.currency || "USD",
            country: profileData.country || "United States",
            cpd_renewal_date: profileData.cpd_renewal_date || null,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at
          });
        } else {
          // Use user data as fallback
          setProfile({
            id: user.id,
            name: user.user_metadata?.full_name || "",
            email: user.email || "",
            icf_level: "none",
            currency: "USD",
            country: "United States",
            created_at: user.created_at,
            updated_at: user.updated_at || new Date().toISOString()
          });
        }
      } catch (error) {
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { user, error: authError } = await getCurrentUser();
      
      if (authError) {
        const errorMessage = authError && typeof authError === 'object' && 'message' in authError 
          ? (authError as any).message 
          : 'Session error';
        setError(`Authentication error: ${errorMessage}`);
        setSaving(false);
        return;
      }
      
      if (!user) {
        router.replace("/login");
        return;
      }


      // Check if email already exists for another user
      // REMOVED: Email uniqueness check due to RLS policy restrictions
      // Users can only query their own profile data, not other users' profiles
      // const { data: existingProfileWithEmail, error: emailCheckError } = await supabase
      //   .from("profiles")
      //   .select("user_id, name")
      //   .eq("email", profile.email.trim())
      //   .neq("user_id", user.id)
      //   .single();


      // if (!emailCheckError && existingProfileWithEmail) {
      //   setShowUserExistsModal(true);
      //   setSaving(false);
      //   return;
      // }

      // Check if profile exists first
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();


      if (profileCheckError && profileCheckError.code === 'PGRST116') {
        // Profile doesn't exist, insert new one
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            name: profile.name.trim(),
            email: profile.email.trim(),
            icf_level: profile.icf_level,
            currency: profile.currency,
            country: profile.country,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          setError(insertError.message || 'Failed to create profile');
          return;
        }
      } else if (profileCheckError) {
        // Some other error occurred
        setError(profileCheckError.message || 'Failed to check profile');
        return;
      } else {
        // Profile exists, update it
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            name: profile.name.trim(),
            email: profile.email.trim(),
            icf_level: profile.icf_level,
            currency: profile.currency,
            country: profile.country,
            cpd_renewal_date: profile.cpd_renewal_date || null,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        if (updateError) {
          setError(updateError.message || 'Failed to update profile');
          return;
        }
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => {
      const newProfile = {
        ...prev,
        [name]: value
      };
      return newProfile;
    });
    
    // Force badge update when ICF level changes
    if (name === 'icf_level') {
      setBadgeUpdateTrigger(prev => prev + 1);
    }
  };

  const getICFBadge = (level: string) => {
    switch (level) {
      case "acc":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: "ACC",
          text: "Associate Certified Coach",
          image: "/badges/AFF.png"
        };
      case "pcc":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: "PCC",
          text: "Professional Certified Coach",
          image: "/badges/PCF.png"
        };
      case "mcc":
        return {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: "MCC",
          text: "Master Certified Coach",
          image: "/badges/MCC.png"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "ICF",
          text: "ICF Member",
          image: "/badges/ICF.png"
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const icfBadge = getICFBadge(profile.icf_level);
  
  // Force re-render when profile changes
  const badgeKey = `badge-${profile.icf_level}-${badgeUpdateTrigger}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <UserIcon className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <h2 className="text-xl font-bold mb-6">Personal Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* ICF Accreditation */}
              <div>
                <label htmlFor="icf_level" className="block text-sm font-medium text-gray-700 mb-2">
                  ICF Accreditation Level
                </label>
                <select
                  id="icf_level"
                  name="icf_level"
                  value={profile.icf_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ICF_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {profile.icf_level !== "none" && (
                  <p className="text-sm text-gray-600 mt-2">
                    {ICF_LEVELS.find(l => l.value === profile.icf_level)?.description}
                  </p>
                )}
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={profile.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-600 mt-2">
                  This currency will be used throughout the application for payment amounts.
                </p>
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country of Residence
                </label>
                <select
                  id="country"
                  name="country"
                  value={profile.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-600 mt-2">
                  This information is used for tax and legal purposes.
                </p>
              </div>

              {/* CPD Renewal Date */}
              <div>
                <label htmlFor="cpd_renewal_date" className="block text-sm font-medium text-gray-700 mb-2">
                  CPD Renewal Deadline
                </label>
                <input
                  type="date"
                  id="cpd_renewal_date"
                  name="cpd_renewal_date"
                  value={profile.cpd_renewal_date || ""}
                  onChange={(e) => setProfile({ ...profile, cpd_renewal_date: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Set your ICF credential renewal date to receive automatic reminders at 90, 75, 50, and 25 days before your deadline.
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>
        </div>

        {/* Badges and Info */}
        <div className="space-y-6">
          {/* ICF Badge */}
          <div key={badgeKey} className="bg-white rounded-xl shadow-lg p-4 border">
            <h3 className="text-lg font-bold mb-3">ICF Accreditation</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img 
                  src={icfBadge.image} 
                  alt={`${icfBadge.text} Badge`}
                  className="w-96 h-96 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    // Show fallback badge
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  onLoad={() => {
                  }}
                />
                {/* Fallback badge if image fails to load */}
                <div 
                  className={`w-24 h-24 rounded-full border-2 flex items-center justify-center text-white font-bold text-lg hidden ${icfBadge.color.replace('text-', 'bg-').replace('border-', 'border-')}`}
                  style={{display: 'none'}}
                >
                  {icfBadge.icon}
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${icfBadge.color} transition-all duration-300`}>
                <CheckBadgeIcon className="h-5 w-5" />
                <span className="font-semibold">{icfBadge.icon}</span>
              </div>
              <p className="text-sm text-gray-600 text-center">{icfBadge.text}</p>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <h3 className="text-lg font-bold mb-4">Profile Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Member since:</span>
                <span className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
              {profile.updated_at && (
                <div className="flex items-center gap-2 text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Last updated:</span>
                  <span className="font-medium">
                    {new Date(profile.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mt-6">
        <Suspense fallback={<div className="p-6 bg-white rounded-xl shadow-lg max-w-md"><p>Loading notification settings...</p></div>}>
          <NotificationSettings />
        </Suspense>
      </div>

      {/* ICF Information - Below both sections */}
      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">About ICF Accreditation</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              The International Coaching Federation (ICF) offers three levels of professional coaching credentials:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">ACC (Associate Certified Coach)</h4>
                <ul className="space-y-1 text-xs">
                  <li>â€¢ Minimum 60 hours of coach-specific training</li>
                  <li>â€¢ At least 100 hours of coaching experience</li>
                  <li>â€¢ Entry-level credential</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">PCC (Professional Certified Coach)</h4>
                <ul className="space-y-1 text-xs">
                  <li>â€¢ Minimum 125 hours of coach-specific training</li>
                  <li>â€¢ At least 500 hours of coaching experience</li>
                  <li>â€¢ Intermediate/Professional-level credential</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">MCC (Master Certified Coach)</h4>
                <ul className="space-y-1 text-xs">
                  <li>â€¢ Minimum 200 hours of coach-specific training</li>
                  <li>â€¢ At least 2,500 hours of coaching experience</li>
                  <li>â€¢ Advanced/Master-level credential</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Exists Modal - REMOVED: No longer needed after removing email uniqueness check */}
    </div>
  );
} 
