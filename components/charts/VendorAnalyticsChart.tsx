"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const views = [
  { month: "Jan", views: 820, leads: 18 },
  { month: "Feb", views: 930, leads: 23 },
  { month: "Mar", views: 1120, leads: 31 },
  { month: "Apr", views: 1280, leads: 36 },
  { month: "May", views: 1460, leads: 42 },
  { month: "Jun", views: 1610, leads: 45 },
];

const sources = [
  { name: "Marketplace", value: 48 },
  { name: "Profile", value: 27 },
  { name: "Referrals", value: 15 },
  { name: "Social", value: 10 },
];

export function VendorAnalyticsChart() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <h3 className="font-semibold">Profile views over time</h3>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={views}>
              <defs>
                <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#C8A97E" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eee7dd" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="#9a7a50" fillOpacity={1} fill="url(#views)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e7dfd3] bg-white p-5 luxury-shadow">
        <h3 className="font-semibold">Lead source breakdown</h3>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sources}>
              <CartesianGrid stroke="#eee7dd" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#61735F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
