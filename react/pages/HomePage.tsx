// react-hono/react/pages/HomePage.tsx
import React from "react";

// Features & Widgets
import { useAuth } from "../features/kakaologin/model/kakaologin"; // User 타입도 가져옵니다.
import { SignInPanel } from "../features/kakaologin/ui/SignInPanel";
import { SignOutButton } from "../features/kakaologin/ui/SignOutButton";

import { CountriesSection } from "../features/countriesExample/ui/CountriesSection";
import { UserDetailsButton } from "../widgets/UserDetailsButton";

const HomePage: React.FC = () => {
  const { user, isLoading: authIsLoading } = useAuth();

  if (authIsLoading) {
    return <div>Loading authentication state...</div>;
  }

  return (
    <>
      <h1>Hono Supabase Auth Example!</h1>
      <hr />
      <section>
        <h2>Sign in / Sign out</h2>
        {!user ? <SignInPanel /> : <SignOutButton />}
      </section>
      <hr />

      {/* Logged In Content */}
      {user && (
        <>
          <section>
            <h2>Example of API fetch() (Hono Client)</h2>
            <UserDetailsButton />
          </section>
          <hr />
          <section>
            <CountriesSection user={user} />
          </section>
        </>
      )}

      {/* Logged Out Content / Placeholder */}
      {!user && (
        <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
          Please sign in to see more examples and fetch data.
        </p>
      )}
    </>
  );
};

export default HomePage;