import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";
import { Brain } from "lucide-react";

const phoneCountries = [
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "+256", name: "Uganda", flag: "🇺🇬" },
  { code: "+255", name: "Tanzania", flag: "🇹🇿" },
  { code: "+250", name: "Rwanda", flag: "🇷🇼" },
  { code: "+243", name: "DR Congo", flag: "🇨🇩" },
  { code: "+260", name: "Zambia", flag: "🇿🇲" },
  { code: "+263", name: "Zimbabwe", flag: "🇿🇼" },
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-4">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg text-white">
          <Brain className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Join {APP_NAME}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Start helping AI learn from clear human feedback
        </p>
      </div>

      <Card>
        <form action={registerAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_1.2fr] gap-2">
            <div>
              <Label htmlFor="phoneCountry">Country</Label>
              <select
                id="phoneCountry"
                name="phoneCountry"
                required
                defaultValue=""
                className="mt-1 min-h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-base"
              >
                <option value="" disabled>
                  Select
                </option>
                {phoneCountries.map((country) => (
                  <option
                    key={`${country.code}-${country.name}`}
                    value={`${country.code}|${country.name}`}
                  >
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="mt-1"
                placeholder="Phone number"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="referralCode">Referral ID</Label>
            <Input
              id="referralCode"
              name="referralCode"
              defaultValue={ref ?? ""}
              readOnly={!!ref}
              required
              className={ref ? "mt-1 bg-slate-100 text-slate-600" : "mt-1"}
            />
            {ref ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                This referral was filled from your invite link and cannot be
                changed.
              </p>
            ) : (
              <p className="mt-1 text-xs text-[var(--muted)]">
                A valid referral ID is required to create an account.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-[var(--muted)]">
        Have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
